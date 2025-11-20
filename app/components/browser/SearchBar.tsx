import { useState, useCallback } from "react";
import { TextField } from "@radix-ui/themes";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function BrowserSearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(query);
    },
    [query, onSearch]
  );

  return (
    <form onSubmit={handleSearch} className="w-full">
      <TextField.Root
        size="2"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
}
