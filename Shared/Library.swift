import Foundation

struct QuoteFolder: Identifiable, Codable, Equatable {
    var id = UUID()
    var name: String
}

struct Notebook: Identifiable, Codable, Equatable {
    var id = UUID()
    var folderID: UUID
    var name: String
}

struct Quote: Identifiable, Codable, Equatable {
    var id = UUID()
    var text: String
    var author: String = ""
    var notebookID: UUID?
    var fontName: String = "Georgia"
    var photoName: String?
    var overlay: Double = 0.4
    var alignment: QuoteAlignment = .center
    var updatedAt = Date()
}

enum QuoteAlignment: String, Codable, CaseIterable {
    case leading, center, trailing
}

struct QuoteLibrary: Codable, Equatable {
    var version = 1
    var folders: [QuoteFolder] = []
    var notebooks: [Notebook] = []
    var quotes: [Quote] = []

    mutating func removeNotebook(_ id: UUID) {
        notebooks.removeAll { $0.id == id }
        for index in quotes.indices where quotes[index].notebookID == id {
            quotes[index].notebookID = nil
        }
    }

    mutating func removeFolder(_ id: UUID) {
        for notebook in notebooks.filter({ $0.folderID == id }) { removeNotebook(notebook.id) }
        folders.removeAll { $0.id == id }
    }
}

struct LibraryDisk {
    let directory: URL

    init(directory: URL) { self.directory = directory }

    static func shared() throws -> LibraryDisk {
        guard let group = Bundle.main.object(forInfoDictionaryKey: "QuoAppGroup") as? String,
              let url = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: group) else {
            throw LibraryError.missingAppGroup
        }
        return LibraryDisk(directory: url.appendingPathComponent("Library", isDirectory: true))
    }

    func load() throws -> QuoteLibrary {
        let url = directory.appendingPathComponent("quotes.json")
        guard FileManager.default.fileExists(atPath: url.path) else { return QuoteLibrary() }
        let library = try JSONDecoder().decode(QuoteLibrary.self, from: Data(contentsOf: url))
        guard library.version == 1 else { throw LibraryError.unsupportedVersion }
        return library
    }

    func save(_ library: QuoteLibrary) throws {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        try encoder.encode(library).write(to: directory.appendingPathComponent("quotes.json"), options: .atomic)
    }

    func savePhoto(_ data: Data) throws -> String {
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let name = UUID().uuidString + ".jpg"
        try data.write(to: directory.appendingPathComponent(name), options: .atomic)
        return name
    }

    func photoURL(_ name: String) -> URL? {
        guard name == (name as NSString).lastPathComponent, name.hasSuffix(".jpg") else { return nil }
        return directory.appendingPathComponent(name)
    }
}

enum LibraryError: LocalizedError {
    case missingAppGroup, unsupportedVersion
    var errorDescription: String? {
        switch self {
        case .missingAppGroup: return "Shared storage is unavailable. Enable the same App Group for Quo and QuoWidgets in Xcode."
        case .unsupportedVersion: return "This library was created with a newer version of Quo. Update the app to open it."
        }
    }
}
