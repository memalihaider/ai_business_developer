"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  filters: { industry: string; location: string };
  setFilters: React.Dispatch<
    React.SetStateAction<{ industry: string; location: string }>
  >;
}

export default function OpportunityFilters({ filters, setFilters }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const resetFilters = () => {
    setFilters({ industry: "", location: "" });
  };

  return (
    <div className="p-4 border border-gray-200 rounded-2xl shadow-sm bg-gray-50">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">🎯 Filters</h3>
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          name="industry"
          value={filters.industry}
          onChange={handleChange}
          placeholder="Industry"
          className="px-3 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-[#7A8063]"
        />
        <input
          type="text"
          name="location"
          value={filters.location}
          onChange={handleChange}
          placeholder="Location"
          className="px-3 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-[#7A8063]"
        />
        <Button
          variant="outline"
          className="rounded-xl text-sm border-gray-300 hover:bg-[#7A8055]/20 transition"
          onClick={resetFilters}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
