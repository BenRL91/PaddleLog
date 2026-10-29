import html from "./paddle.html?raw";
export function GET(){return new Response(html.replace(/src="\/app.js[^"]*"/,'src="/web-entry.js?v=notebook-brand1"'),{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}})}
