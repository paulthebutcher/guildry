"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Person } from "@guildry/database";
import { PersonCard } from "@/components/people/person-card";
import { Plus, Users } from "lucide-react";

interface PersonWithSkills extends Person {
  person_skills?: Array<{
    skill_id: string;
    proficiency_level: number;
    years_experience?: number;
    skill?: {
      id: string;
      name: string;
      category: string;
    };
  }>;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<PersonWithSkills[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchPeople() {
      try {
        const params = new URLSearchParams();
        if (filter !== "all") {
          params.set("availability", filter);
        }

        const response = await fetch(`/api/people?${params.toString()}`);
        const { data } = await response.json();
        setPeople(data || []);
      } catch (error) {
        console.error("Failed to fetch people:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPeople();
  }, [filter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Bench</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-lg p-6 animate-pulse"
            >
              <div className="h-6 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bench</h1>
          <p className="text-slate-600 mt-1">
            Your talent network - employees, contractors, and referrals
          </p>
        </div>
        <Link
          href="/people/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent-bench text-white rounded-lg hover:bg-accent-bench/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Person
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: "all", label: "All" },
          { value: "available", label: "Available" },
          { value: "partial", label: "Partial" },
          { value: "booked", label: "Booked" },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              filter === option.value
                ? "bg-accent-bench text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {people.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {filter === "all" ? "No people yet" : "No one matches this filter"}
          </h3>
          <p className="text-slate-600 mb-6">
            {filter === "all"
              ? "Start building your talent network by adding people you work with."
              : "Try a different filter or add more people to your network."}
          </p>
          {filter === "all" && (
            <Link
              href="/people/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent-bench text-white rounded-lg hover:bg-accent-bench/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Person
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
