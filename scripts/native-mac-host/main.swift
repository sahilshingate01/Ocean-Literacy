import Cocoa
import WebKit

final class OceanAppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        let screenRect = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1280, height: 800)
        let windowWidth: CGFloat = min(1280, screenRect.width - 60)
        let windowHeight: CGFloat = min(840, screenRect.height - 60)
        let x = screenRect.midX - windowWidth / 2
        let y = screenRect.midY - windowHeight / 2

        let rect = NSRect(x: x, y: y, width: windowWidth, height: windowHeight)
        window = NSWindow(
            contentRect: rect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.title = "Ocean Literacy"
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.backgroundColor = NSColor(red: 8.0/255.0, green: 20.0/255.0, blue: 34.0/255.0, alpha: 1.0)
        window.minSize = NSSize(width: 960, height: 600)

        let config = WKWebViewConfiguration()
        let prefs = WKWebpagePreferences()
        prefs.allowsContentJavaScript = true
        config.defaultWebpagePreferences = prefs
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")

        webView = WKWebView(frame: window.contentView!.bounds, configuration: config)
        webView.autoresizingMask = [.width, .height]
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.setValue(false, forKey: "drawsBackground")

        window.contentView?.addSubview(webView)
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)

        // Locate bundled index.html
        if let resourceURL = Bundle.main.resourceURL {
            let htmlURL = resourceURL.appendingPathComponent("src/renderer/index.html")
            if FileManager.default.fileExists(atPath: htmlURL.path) {
                webView.loadFileURL(htmlURL, allowingReadAccessTo: resourceURL)
            } else {
                let fallback = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
                    .appendingPathComponent("src/renderer/index.html")
                webView.loadFileURL(fallback, allowingReadAccessTo: fallback.deletingLastPathComponent())
            }
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}

let app = NSApplication.shared
let delegate = OceanAppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
