import SwiftUI

enum LibrarySelection: Hashable {
    case all, unfiled, notebook(UUID)
}

struct LibraryView: View {
    @EnvironmentObject private var store: LibraryStore
    @State private var selection: LibrarySelection? = .all
    @State private var search = ""
    @State private var editing: Quote?
    @State private var naming = false
    @State private var newName = ""
    @State private var parentFolder: UUID?
    @State private var deletion: Quote?
    @State private var showingHelp = false

    private var title: String {
        if case .notebook(let id) = selection { return store.library.notebooks.first(where: { $0.id == id })?.name ?? "Notebook" }
        return selection == .unfiled ? "Unfiled" : "All quotes"
    }

    private var quotes: [Quote] {
        store.library.quotes.filter { quote in
            let included: Bool
            switch selection {
            case .notebook(let id): included = quote.notebookID == id
            case .unfiled: included = quote.notebookID == nil
            default: included = true
            }
            return included && (search.isEmpty || quote.text.localizedCaseInsensitiveContains(search) || quote.author.localizedCaseInsensitiveContains(search))
        }.sorted { $0.updatedAt > $1.updatedAt }
    }

    var body: some View {
        NavigationSplitView {
            List(selection: $selection) {
                Label("All quotes", systemImage: "square.grid.2x2").tag(LibrarySelection.all)
                Label("Unfiled", systemImage: "tray").tag(LibrarySelection.unfiled)
                ForEach(store.library.folders) { folder in
                    Section {
                        ForEach(store.library.notebooks.filter { $0.folderID == folder.id }) { notebook in
                            Label(notebook.name, systemImage: "book.closed").tag(LibrarySelection.notebook(notebook.id))
                                .contextMenu {
                                    Button("Remove notebook (keep quotes)", role: .destructive) {
                                        if store.update({ $0.removeNotebook(notebook.id) }) { selection = .unfiled }
                                    }
                                }
                        }
                        Button { parentFolder = folder.id; newName = ""; naming = true } label: {
                            Label("New notebook", systemImage: "plus")
                        }
                    } header: {
                        Text(folder.name).contextMenu {
                            Button("Remove folder (keep quotes)", role: .destructive) {
                                if store.update({ $0.removeFolder(folder.id) }) { selection = .unfiled }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Quo")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button { parentFolder = nil; newName = ""; naming = true } label: { Label("New folder", systemImage: "folder.badge.plus") }
                }
            }
        } detail: {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    Text("WORDS WORTH KEEPING").font(.caption.weight(.semibold)).tracking(3).foregroundStyle(.secondary)
                    if quotes.isEmpty {
                        ContentUnavailableView(search.isEmpty ? "A little inspiration lives here" : "No matching quotes", systemImage: "quote.opening", description: Text(search.isEmpty ? "Add a quote, make it yours, and bring it to your Home Screen." : "Try another word or author."))
                    } else {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 260), spacing: 20)], spacing: 20) {
                            ForEach(quotes) { quote in
                                Button { editing = quote } label: {
                                    QuoteCanvas(quote: quote).frame(height: 230).clipShape(RoundedRectangle(cornerRadius: 24))
                                }
                                .buttonStyle(.plain)
                                .contextMenu {
                                    Button("Edit", systemImage: "pencil") { editing = quote }
                                    Button("Delete", systemImage: "trash", role: .destructive) { deletion = quote }
                                }
                            }
                        }
                    }
                }.padding(24)
            }
            .background(Color(uiColor: .systemGroupedBackground))
            .navigationTitle(title)
            .searchable(text: $search, prompt: "Search words or authors")
            .toolbar {
                ToolbarItemGroup(placement: .primaryAction) {
                    Button { showingHelp = true } label: { Label("Widget help", systemImage: "square.stack.3d.up") }
                    Button {
                        var quote = Quote(text: "")
                        if case .notebook(let id) = selection { quote.notebookID = id }
                        editing = quote
                    } label: { Label("Add quote", systemImage: "plus") }
                    .disabled(!store.loaded)
                }
            }
        }
        .sheet(item: $editing) { QuoteEditor(quote: $0).environmentObject(store) }
        .alert(parentFolder == nil ? "New folder" : "New notebook", isPresented: $naming) {
            TextField("Name", text: $newName)
            Button("Cancel", role: .cancel) {}
            Button("Create") {
                let name = newName.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !name.isEmpty else { return }
                store.update { library in
                    if let parentFolder { library.notebooks.append(Notebook(folderID: parentFolder, name: name)) }
                    else { library.folders.append(QuoteFolder(name: name)) }
                }
            }
        }
        .alert("Delete quote?", isPresented: Binding(get: { deletion != nil }, set: { if !$0 { deletion = nil } })) {
            Button("Cancel", role: .cancel) { deletion = nil }
            Button("Delete", role: .destructive) {
                if let deletion { store.update { $0.quotes.removeAll { $0.id == deletion.id } } }
                deletion = nil
            }
        } message: { Text("Widgets displaying this quote will ask you to choose another quote.") }
        .alert("Library unavailable", isPresented: Binding(get: { store.error != nil && editing == nil }, set: { if !$0 { store.error = nil } })) {
            Button("Retry") { store.reload() }
            Button("Dismiss", role: .cancel) { store.error = nil }
        } message: { Text(store.error ?? "") }
        .sheet(isPresented: $showingHelp) {
            NavigationStack {
                List {
                    Section("Your words, on your Home Screen") {
                        Text("1. Save a quote with your preferred photo and font.")
                        Text("2. Touch and hold the Home Screen, then choose Edit → Add Widget (or +). Search for Quo.")
                        Text("3. Choose a supported size and add the widget.")
                        Text("4. Touch and hold the widget, choose Edit Widget, then select your quote.")
                    }
                    Section("Designed to fit") {
                        Text("Small, medium, large, and extra-large on supported iPads. Apple sets widget dimensions; Quo automatically fits the text to the available space. Very long quotes may become small. Updates appear on Apple's widget refresh schedule.")
                    }
                }.navigationTitle("Quote widgets").toolbar { Button("Done") { showingHelp = false } }
            }
        }
    }
}
