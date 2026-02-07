import Link from "next/link";
import { Person, PersonType, AvailabilityStatus } from "@guildry/database";

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

interface PersonCardProps {
  person: Person & { person_skills?: PersonSkill[] };
}

const AVAILABILITY_COLORS: Record<AvailabilityStatus, { bg: string; text: string }> = {
  [AvailabilityStatus.AVAILABLE]: { bg: "bg-green-100", text: "text-green-800" },
  [AvailabilityStatus.PARTIAL]: { bg: "bg-yellow-100", text: "text-yellow-800" },
  [AvailabilityStatus.BOOKED]: { bg: "bg-orange-100", text: "text-orange-800" },
  [AvailabilityStatus.UNAVAILABLE]: { bg: "bg-slate-100", text: "text-slate-600" },
};

const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  [AvailabilityStatus.AVAILABLE]: "Available",
  [AvailabilityStatus.PARTIAL]: "Partial",
  [AvailabilityStatus.BOOKED]: "Booked",
  [AvailabilityStatus.UNAVAILABLE]: "Unavailable",
};

const TYPE_LABELS: Record<PersonType, string> = {
  [PersonType.EMPLOYEE]: "Employee",
  [PersonType.CONTRACTOR]: "Contractor",
  [PersonType.REFERRAL]: "Referral",
};

const TYPE_COLORS: Record<PersonType, string> = {
  [PersonType.EMPLOYEE]: "bg-purple-100 text-purple-800",
  [PersonType.CONTRACTOR]: "bg-blue-100 text-blue-800",
  [PersonType.REFERRAL]: "bg-amber-100 text-amber-800",
};

export function PersonCard({ person }: PersonCardProps) {
  const availabilityColor =
    AVAILABILITY_COLORS[person.availability_status] ||
    AVAILABILITY_COLORS[AvailabilityStatus.AVAILABLE];

  // Get top skills (first 3)
  const topSkills = person.person_skills?.slice(0, 3) || [];

  return (
    <Link href={`/people/${person.id}`}>
      <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-accent-bench transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {person.name}
            </h3>
            <span className={`inline-block text-xs px-2 py-0.5 rounded ${TYPE_COLORS[person.type]}`}>
              {TYPE_LABELS[person.type]}
            </span>
          </div>
          <span
            className={`inline-block text-xs px-2 py-1 rounded-full ${availabilityColor.bg} ${availabilityColor.text}`}
          >
            {AVAILABILITY_LABELS[person.availability_status]}
          </span>
        </div>

        {person.location && (
          <p className="text-sm text-slate-500 mb-3">
            📍 {person.location}
          </p>
        )}

        {topSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {topSkills.map((ps) => (
              <span
                key={ps.skill_id}
                className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded"
              >
                {ps.skill?.name || "Unknown"}
              </span>
            ))}
            {(person.person_skills?.length || 0) > 3 && (
              <span className="text-xs text-slate-400">
                +{(person.person_skills?.length || 0) - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-slate-500">
          {person.hourly_rate && (
            <span className="font-medium">
              {person.currency} ${person.hourly_rate}/hr
            </span>
          )}
          {person.rating && (
            <span>
              {"⭐".repeat(Math.round(person.rating))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
