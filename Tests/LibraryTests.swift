import XCTest
@testable import Quo

final class LibraryTests: XCTestCase {
    func testLibraryAndPhotoRoundTrip() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        let disk = LibraryDisk(directory: directory)
        XCTAssertEqual(try disk.load(), QuoteLibrary())
        let bytes = Data([1, 2, 3, 4])
        let photo = try disk.savePhoto(bytes)
        var library = QuoteLibrary()
        library.quotes = [Quote(text: "Keep going.", author: "A", fontName: "Georgia", photoName: photo)]
        try disk.save(library)
        XCTAssertEqual(try disk.load(), library)
        XCTAssertEqual(try Data(contentsOf: XCTUnwrap(disk.photoURL(photo))), bytes)
        library.quotes[0].text = "Changed"
        try disk.save(library)
        XCTAssertEqual(try disk.load().quotes[0].text, "Changed")
        XCTAssertNil(disk.photoURL("../outside.jpg"))
    }

    func testRemovingFolderPreservesQuotesAsUnfiled() {
        let folder = QuoteFolder(name: "Life")
        let notebook = Notebook(folderID: folder.id, name: "Ideas")
        let quote = Quote(text: "Hello", notebookID: notebook.id)
        var library = QuoteLibrary(folders: [folder], notebooks: [notebook], quotes: [quote])
        library.removeFolder(folder.id)
        XCTAssertTrue(library.folders.isEmpty)
        XCTAssertTrue(library.notebooks.isEmpty)
        XCTAssertEqual(library.quotes.count, 1)
        XCTAssertNil(library.quotes[0].notebookID)
    }

    func testCorruptLibraryIsNotSilentlyReplaced() throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: directory) }
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let data = Data("not json".utf8)
        let file = directory.appendingPathComponent("quotes.json")
        try data.write(to: file)
        XCTAssertThrowsError(try LibraryDisk(directory: directory).load())
        XCTAssertEqual(try Data(contentsOf: file), data)
    }
}
