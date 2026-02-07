"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Person, PersonType, AvailabilityStatus } from "@guildry/database";
import {
  ArrowLeft,
  Mail,
  MapPin,
  DollarSign,
  Star,
  Edit,
  Clock,
} from "lucide-react";

interface PersonSkill {
  skill_id: string;
  proficiency_level: number;
  years_experience?: number;
  skill?: {
    id: string;
    name: string;
    category: string;
  };
}

interface PersonWithSkills extends Person {
  person_skills?: PersonSkill[];
}

const AVAILABILITY_COLORS: Record<AvailabilityStatus, { bg: string; text: string }> = {
  [AvailabilityStatus.AVAILABLE]: { bg: "bg-green-100", text: "text-green-800" },
  [AvailabilityStatus.PARTIAL]: { bg: "bg-yellow-100", text: "text-yellow-800" },
  [AvailabilityStatus.BOOKED]: { bg: "bg-orange-100", text: "text-orange-800" },
  [AvailabilityStatus.UNAVAILABLE]: { bg: "bg-slate-100", text: "text-slate-600" },
};

const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  [AvailabilityStatus.AVAILABLE]: "Available",
  [AvailabilityStatus.PARTIAL]: "Partial Availability",
  [AvailabilityStatus.BOOKED]: "Fully Booked",
  [AvailabilityStatus.UNAVAILABLE]: "Unavailable",
};

const TYPE_LABELS: Record<PersonType, string> = {
  [PersonType.EMPLOYEE]: "Employee",
  [PersonType.CONTRACTOR]: "Contractor",
  [PersonType.REFERRAL]: "Referral",
};

const CATEGORY_COLORS: Record<string, string> = {
  design: "bg-pink-100 text-pink-800",
  engineering: "bg-blue-100 text-blue-800",
  strategy: "bg-purple-100 text-purple-800",
  ops: "bg-orange-100 text-orange-800",
  marketing: "bg-green-100 text-green-800",
  data: "bg-cyan-100 text-cyan-800",
};

export default function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [person, setPerson] = useState<PersonWithSkills | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPerson() {
      try {
        const response = await fetch(`/api/people/${id}`);
        if (!response.ok) {
          throw new Error("Person not found");
        }
        const { data } = await response.json();
        setPerson(data);
      } catch (err) {
        console.error("Failed to fetch person:", err);
        setError("Failed to load person details");
      } finally {
        setLoading(false);
      }
    }

    fetchPerson();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-slate-200 rounded w-1/4 mb-8" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-slate-200 rounded" />
            <div className="h-24 bg-slate-200 rounded" />
            <div className="h-24 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="space-y-6">
        <Link
          href="/people"
          className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Bench
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error || "Person not found"}</p>
        </div>
      </div>
    );
  }

  const availabilityColor =
    AVAILABILITY_COLORS[person.availability_status] ||
    AVAILABILITY_COLORS[AvailabilityStatus.AVAILABLE];

  // Group skills by category
  const skillsByCategory = person.person_skills?.reduce(
    (acc, ps) => {
      const category = ps.skill?.category || "other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(ps);
      return acc;
    },
    {} as Record<string, PersonSkill[]>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/people"
            className="inline-flex items-center text-sm text-slate-600 hover:text-slate-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Bench
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{person.name}</h1>
            <span
              className={`inline-block text-sm px-3 py-1 rounded-full ${availabilityColor.bg} ${availabilityColor.text}`}
            >
              {AVAILABILITY_LABELS[person.availability_status]}
            </span>
          </div>
          <p className="text-slate-600 mt-1">{TYPE_LABELS[person.type]}</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <Edit className="w-4 h-4" />
          Edit
        </button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {person.email && (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <Mail className="w-4 h-4" />
              <span className="text-sm">Email</span>
            </div>
            <a
              href={`mailto:${person.email}`}
              className="text-accent-bench hover:underline"
            >
              {person.email}
            </a>
          </div>
        )}

        {person.location && (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Location</span>
            </div>
            <p className="text-slate-900">{person.location}</p>
          </div>
        )}

        {person.hourly_rate && (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Hourly Rate</span>
            </div>
            <p className="text-slate-900 font-semibold">
              {person.currency} ${person.hourly_rate}/hr
            </p>
          </div>
        )}

        {person.rating && (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-600 mb-1">
              <Star className="w-4 h-4" />
              <span className="text-sm">Rating</span>
            </div>
            <p className="text-slate-900">
              {person.rating}/5 {"⭐".repeat(Math.round(person.rating))}
            </p>
          </div>
        )}
      </div>

      {/* Skills */}
      {person.person_skills && person.person_skills.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Skills</h2>
          <div className="space-y-4">
            {Object.entries(skillsByCategory || {}).map(([category, skills]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
                  {category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((ps) => (
                    <div
                      key={ps.skill_id}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        CATEGORY_COLORS[category] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="font-medium">{ps.skill?.name}</span>
                      <span className="text-xs opacity-75">
                        Lvl {ps.proficiency_level}
                        {ps.years_experience && ` · ${ps.years_experience}y`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {person.notes && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Notes</h2>
          <p className="text-slate-700 whitespace-pre-wrap">{person.notes}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          Added {new Date(person.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
