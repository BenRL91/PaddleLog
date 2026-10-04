import Capacitor
import StoreKit

// Add to the generated iOS target and register with the bridge before enabling billing.
@objc(PaddleLifePurchasesPlugin)
public class PaddleLifePurchasesPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "PaddleLifePurchasesPlugin"
    public let jsName = "PaddleLifePurchases"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finish", returnType: CAPPluginReturnPromise)
    ]
    private let store = PaddleLifeStore()
    private var updates: Task<Void, Never>?
    public override func load() {
        updates = Task { [weak self] in
            for await result in Transaction.updates {
                if case .verified = result {
                    await MainActor.run { self?.notifyListeners("transaction", data: ["signedTransaction": result.jwsRepresentation], retainUntilConsumed: true) }
                }
            }
        }
    }
    deinit { updates?.cancel() }
    @objc func products(_ call: CAPPluginCall) {
        guard let ids = call.getArray("ids", String.self) else { call.reject("Missing product IDs"); return }
        Task {
            do {
                let products = try await store.products(ids: ids)
                let values: [[String: Any]] = products.compactMap { product in
                    guard let subscription = product.subscription else { return nil }
                    let period = subscription.subscriptionPeriod
                    guard period.value == 1 && (period.unit == .month || period.unit == .year) else { return nil }
                    return ["id": product.id, "displayName": product.displayName, "displayPrice": product.displayPrice,
                            "price": NSDecimalNumber(decimal: product.price).doubleValue,
                            "currency": product.priceFormatStyle.currencyCode,
                            "period": period.unit == .year ? "year" : "month"]
                }
                call.resolve(["products": values])
            } catch { call.reject("Unable to load App Store products") }
        }
    }
    @objc func purchase(_ call: CAPPluginCall) {
        guard let id = call.getString("productId"), let token = call.getString("appAccountToken"), let account = UUID(uuidString: token) else { call.reject("Missing account or product"); return }
        Task {
            do {
                guard let product = try await store.products(ids: [id]).first else { call.reject("Product unavailable"); return }
                switch try await store.purchase(product: product, accountId: account) {
                case .cancelled: call.resolve(["status": "cancelled"])
                case .pending: call.resolve(["status": "pending"])
                case .verified(let signed, _): call.resolve(["status": "verified-on-device", "signedTransaction": signed])
                }
            } catch { call.reject("Purchase could not be verified") }
        }
    }
    @objc func restore(_ call: CAPPluginCall) {
        Task { do { call.resolve(["transactions": try await store.restore()]) } catch { call.reject("Restore failed") } }
    }
    @objc func finish(_ call: CAPPluginCall) {
        guard let text = call.getString("transactionId"), let id = UInt64(text) else { call.reject("Invalid transaction"); return }
        Task { await store.finish(id: id); call.resolve() }
    }
}
