import type { TeamMember } from '@softmato/db';

/**
 * Photos are plain `<img>` rather than `next/image`: the URLs point at the R2
 * public bucket, which is not in `next.config.ts` remotePatterns. Switch to
 * `next/image` when that bucket is configured, not before — an unconfigured
 * host makes the build fail rather than degrade.
 */
export function TeamGrid({ members }: { members: TeamMember[] }) {
  if (members.length === 0) {
    return (
      <p className="mt-8 text-sm text-muted-foreground">
        Team members appear here once they are added and published.
      </p>
    );
  }

  return (
    <ul className="mt-10 grid gap-6 sm:grid-cols-2">
      {members.map((member) => (
        <li key={member.id} className="section-frame rounded-lg p-5">
          {member.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.photoUrl}
              alt=""
              className="mb-4 h-20 w-20 rounded-full object-cover"
            />
          ) : null}

          <p className="font-medium">{member.name}</p>
          <p className="text-sm text-muted-foreground">{member.role}</p>

          {member.bio ? (
            <p className="mt-3 text-sm leading-relaxed">{member.bio}</p>
          ) : null}

          <ul className="mt-3 flex gap-4 text-sm">
            {member.linkedinUrl ? (
              <li>
                <a
                  href={member.linkedinUrl}
                  className="text-primary hover:underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  LinkedIn
                </a>
              </li>
            ) : null}
            {member.githubUrl ? (
              <li>
                <a
                  href={member.githubUrl}
                  className="text-primary hover:underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  GitHub
                </a>
              </li>
            ) : null}
          </ul>
        </li>
      ))}
    </ul>
  );
}
