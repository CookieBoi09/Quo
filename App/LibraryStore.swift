import SwiftUI
import WidgetKit

@MainActor
final class LibraryStore: ObservableObject {
    @Published private(set) var library = QuoteLibrary()
    @Published var error: String?
    @Published private(set) var loaded = false

    init() { reload() }

    func reload() {
        do {
            library = try LibraryDisk.shared().load()
            loaded = true
            error = nil
        } catch { self.error = error.localizedDescription }
    }

    @discardableResult
    func update(_ change: (inout QuoteLibrary) -> Void) -> Bool {
        guard loaded else { return false }
        do {
            var next = library
            change(&next)
            try LibraryDisk.shared().save(next)
            library = next
            WidgetCenter.shared.reloadAllTimelines()
            return true
        } catch {
            self.error = error.localizedDescription
            return false
        }
    }

    func save(_ quote: Quote, photo: Data?) -> Bool {
        do {
            var next = quote
            if let photo { next.photoName = try LibraryDisk.shared().savePhoto(photo) }
            next.updatedAt = Date()
            return update { library in
                if let index = library.quotes.firstIndex(where: { $0.id == next.id }) { library.quotes[index] = next }
                else { library.quotes.insert(next, at: 0) }
            }
        } catch { self.error = error.localizedDescription; return false }
    }
}
