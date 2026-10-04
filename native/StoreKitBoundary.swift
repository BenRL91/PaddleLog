import StoreKit
// Integration component, not yet registered as a Capacitor plugin. Compile on macOS.
@available(iOS 15.0, *)
actor PaddleLifeStore {
    enum PurchaseOutcome { case cancelled, pending, verified(String, UInt64) }
    func products(ids: [String]) async throws -> [Product] { try await Product.products(for: ids) }
    func purchase(product: Product, accountId: UUID) async throws -> PurchaseOutcome {
        switch try await product.purchase(options: [.appAccountToken(accountId)]) {
        case .userCancelled: return .cancelled
        case .pending: return .pending
        case .success(let result):
            switch result {
            case .verified(let transaction): return .verified(result.jwsRepresentation, transaction.id)
            case .unverified: throw StoreError.unverified
            }
        @unknown default: throw StoreError.unverified
        }
    }
    func restore() async throws -> [String] {
        try await AppStore.sync()
        var signed: [String] = []
        for await result in Transaction.currentEntitlements {
            if case .verified = result { signed.append(result.jwsRepresentation) }
        }
        return signed
    }
    // Call only after server verification + durable entitlement update succeeds.
    func finish(id: UInt64) async {
        for await result in Transaction.unfinished {
            if case .verified(let transaction) = result, transaction.id == id { await transaction.finish() }
        }
    }
    enum StoreError: Error { case unverified }
}
