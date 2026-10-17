// Reading list. Add a book by adding an entry; newest first.

export type Book = {
  title: string;
  author: string;
  note?: string;
  status: "reading" | "read";
};

export const books: Book[] = [
  { title: "Placeholder book title", author: "Author Name", status: "reading", note: "A line on why it's worth reading." },
  { title: "Another placeholder", author: "Author Name", status: "read" },
];
