import SwiftUI
import PhotosUI
import UIKit

struct QuoteEditor: View {
    @EnvironmentObject private var store: LibraryStore
    @Environment(\.dismiss) private var dismiss
    @State var quote: Quote
    @State private var photo: PhotosPickerItem?
    @State private var photoData: Data?
    @State private var photoError: String?
    @State private var loadingPhoto = false
    @State private var fontPicker = false
    @State private var size = PreviewSize.medium

    enum PreviewSize: String, CaseIterable {
        case small = "Small", medium = "Medium", large = "Large", extraLarge = "XL"
        var ratio: CGFloat {
            switch self { case .small, .large: return 1; case .medium, .extraLarge: return 2.1 }
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    QuoteCanvas(quote: quote, photoData: photoData)
                        .aspectRatio(size.ratio, contentMode: .fit)
                        .frame(maxWidth: size == .small ? 170 : 500)
                        .clipShape(RoundedRectangle(cornerRadius: 24))
                        .frame(maxWidth: .infinity)
                        .listRowBackground(Color.clear)
                    Picker("Preview size", selection: $size) {
                        ForEach(PreviewSize.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                    }.pickerStyle(.segmented)
                    Text("Proportional previews. Actual dimensions depend on your device.").font(.caption).foregroundStyle(.secondary)
                }
                Section("The quote") {
                    TextEditor(text: $quote.text).frame(minHeight: 110).accessibilityLabel("Quote text")
                    TextField("Author or source (optional)", text: $quote.author)
                    Picker("Notebook", selection: $quote.notebookID) {
                        Text("Unfiled").tag(nil as UUID?)
                        ForEach(store.library.notebooks) { notebook in
                            let folder = store.library.folders.first { $0.id == notebook.folderID }?.name ?? ""
                            Text("\(folder) / \(notebook.name)").tag(Optional(notebook.id))
                        }
                    }
                }
                Section("Typography") {
                    Button { fontPicker = true } label: {
                        HStack { Text("Font"); Spacer(); Text(quote.fontName).font(.custom(quote.fontName, size: 17)).foregroundStyle(.secondary) }
                    }
                    Picker("Alignment", selection: $quote.alignment) {
                        ForEach(QuoteAlignment.allCases, id: \.self) { Text($0.rawValue.capitalized).tag($0) }
                    }.pickerStyle(.segmented)
                    Text("Text automatically scales to fit every widget size.").font(.caption).foregroundStyle(.secondary)
                }
                Section("Background") {
                    PhotosPicker(selection: $photo, matching: .images) { Label("Choose photo", systemImage: "photo") }
                    if loadingPhoto { ProgressView("Loading photo…") }
                    if photoData != nil || quote.photoName != nil {
                        Button("Remove photo", role: .destructive) { photo = nil; photoData = nil; quote.photoName = nil }
                    }
                    HStack { Text("Darken"); Slider(value: $quote.overlay, in: 0...0.85) }
                }
            }
            .navigationTitle(quote.text.isEmpty ? "New quote" : "Make it yours")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        quote.text = quote.text.trimmingCharacters(in: .whitespacesAndNewlines)
                        if store.save(quote, photo: photoData) { dismiss() }
                    }.disabled(quote.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || loadingPhoto)
                }
            }
            .sheet(isPresented: $fontPicker) { FontPicker(selected: $quote.fontName) }
            .task(id: photo) {
                guard let photo else { loadingPhoto = false; return }
                loadingPhoto = true
                defer { if self.photo == photo { loadingPhoto = false } }
                do {
                    guard let data = try await photo.loadTransferable(type: Data.self) else { throw PhotoError.invalid }
                    try Task.checkCancellation()
                    guard self.photo == photo else { return }
                    guard let image = UIImage(data: data) else { throw PhotoError.invalid }
                    let scale = min(1, 1600 / max(image.size.width, image.size.height))
                    let target = CGSize(width: image.size.width * scale, height: image.size.height * scale)
                    let format = UIGraphicsImageRendererFormat()
                    format.scale = 1
                    let resized = UIGraphicsImageRenderer(size: target, format: format).image { _ in image.draw(in: CGRect(origin: .zero, size: target)) }
                    guard let jpeg = resized.jpegData(compressionQuality: 0.85) else { throw PhotoError.invalid }
                    photoData = jpeg
                } catch is CancellationError { }
                catch { photoError = error.localizedDescription }
            }
            .alert("Unable to save", isPresented: Binding(get: { store.error != nil }, set: { if !$0 { store.error = nil } })) {
                Button("OK") { store.error = nil }
            } message: { Text(store.error ?? "") }
            .alert("Unable to load photo", isPresented: Binding(get: { photoError != nil }, set: { if !$0 { photoError = nil } })) {
                Button("OK") { photoError = nil }
            } message: { Text(photoError ?? "") }
        }
    }
}

enum PhotoError: LocalizedError {
    case invalid
    var errorDescription: String? { "This photo could not be opened. Choose another image or download it from iCloud first." }
}

struct FontPicker: View {
    @Binding var selected: String
    @Environment(\.dismiss) private var dismiss
    @State private var search = ""
    private let fonts = UIFont.familyNames.sorted().flatMap { UIFont.fontNames(forFamilyName: $0).sorted() }
    var body: some View {
        NavigationStack {
            List(fonts.filter { search.isEmpty || $0.localizedCaseInsensitiveContains(search) }, id: \.self) { name in
                Button { selected = name; dismiss() } label: {
                    VStack(alignment: .leading, spacing: 5) {
                        HStack { Text(name).font(.caption).foregroundStyle(.secondary); Spacer(); if selected == name { Image(systemName: "checkmark") } }
                        Text("Words worth keeping").font(.custom(name, size: 23)).foregroundStyle(.primary)
                    }.padding(.vertical, 5)
                }
            }
            .searchable(text: $search, prompt: "Search fonts")
            .navigationTitle("Choose a font")
            .toolbar { Button("Done") { dismiss() } }
        }
    }
}
