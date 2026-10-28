import SwiftUI

@main
struct QuoApp: App {
    @StateObject private var store = LibraryStore()
    var body: some Scene {
        WindowGroup {
            LibraryView().environmentObject(store).tint(Color(red: 0.24, green: 0.43, blue: 0.36))
        }
    }
}
