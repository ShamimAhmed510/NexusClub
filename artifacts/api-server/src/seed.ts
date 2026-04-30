import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import {
  db,
  pool,
  usersTable,
  clubsTable,
  membershipsTable,
  eventsTable,
  postsTable,
  noticesTable,
  mediaTable,
  joinRequestsTable,
} from "@workspace/db";

type SeedClub = {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  accentColor: string;
  websiteUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
};

const CLUBS: SeedClub[] = [
  {
    slug: "mu-islamic-society",
    name: "MU Islamic Society",
    category: "Religious & Cultural",
    shortDescription:
      "A community for Islamic learning, dawah, and student welfare at Metropolitan University.",
    description:
      "MU Islamic Society organises Friday lectures, Quran study circles, Iftar gatherings during Ramadan, charity drives, and seerah seminars. Open to students of every background, we explore Islamic thought, ethics, and contemporary issues through workshops, panels, and community service in Sylhet.",
    accentColor: "#0f6e4f",
  },
  {
    slug: "mu-cse-society",
    name: "MU CSE Society",
    category: "Academic & Technology",
    shortDescription:
      "The official society of the Department of Computer Science & Engineering at MU.",
    description:
      "MU CSE Society runs hackathons, programming contests, technical workshops, alumni talks, and project showcases. From competitive programming bootcamps to AI/ML reading groups, we help CSE students explore industry, research, and entrepreneurship together.",
    accentColor: "#1e3a8a",
  },
  {
    slug: "mu-sports-club",
    name: "MU Sports Club",
    category: "Sports & Recreation",
    shortDescription:
      "Cricket, football, badminton, table tennis and inter-university tournaments at MU.",
    description:
      "MU Sports Club coordinates intra-departmental leagues, hosts the annual MU Sports Carnival, and represents the university in regional and national tournaments. Whether you are a casual player or a serious athlete, the club provides coaching, training slots, and team selections across multiple disciplines.",
    accentColor: "#dc2626",
  },
  {
    slug: "mu-research-society",
    name: "MU Research Society",
    category: "Academic & Research",
    shortDescription:
      "Encouraging undergraduate research, journal clubs, and conference participation.",
    description:
      "MU Research Society guides students through the full research lifecycle — from literature review and methodology workshops to writing for publication. We host journal clubs across disciplines, support submissions to undergraduate conferences, and connect students with faculty mentors.",
    accentColor: "#7c3aed",
  },
  {
    slug: "mu-hult-prize",
    name: "MU Hult Prize",
    category: "Entrepreneurship & Innovation",
    shortDescription:
      "Metropolitan University's chapter of the world's largest student social impact competition.",
    description:
      "We run the on-campus Hult Prize qualifier each fall, mentor student teams through ideation and pitching, and send our champions to regional summits. Expect bootcamps on business model design, lean startup, and impact measurement throughout the year.",
    accentColor: "#0ea5e9",
  },
  {
    slug: "mu-cultural-club",
    name: "MU Cultural Club",
    category: "Arts & Culture",
    shortDescription:
      "Music, dance, drama, and the cultural pulse of Metropolitan University.",
    description:
      "MU Cultural Club celebrates Bangla heritage and contemporary art through Pohela Boishakh, Victory Day shows, talent nights, drama workshops, and the annual Cultural Fest. Singers, dancers, actors, and behind-the-scenes crew all find a home here.",
    accentColor: "#db2777",
  },
  {
    slug: "mu-mun",
    name: "MU Model United Nations",
    category: "Diplomacy & Debate",
    shortDescription:
      "Training the next generation of diplomats through MUN simulations and conferences.",
    description:
      "MU MUN trains students in research, public speaking, and diplomacy. We run weekly committee simulations, host MUMUN — our flagship inter-university conference — and send delegations to national and international MUNs across South Asia.",
    accentColor: "#0d9488",
  },
  {
    slug: "mu-cycling-association",
    name: "MU Cycling Association",
    category: "Sports & Recreation",
    shortDescription:
      "Group rides, long-distance trips, and bicycle advocacy on campus and beyond.",
    description:
      "MU Cycling Association arranges weekend rides through Sylhet's tea gardens and hill tracks, organises long-distance cycling tours, and promotes safe cycling culture on campus. Members get access to maintenance workshops, safety gear briefings, and a community of riders.",
    accentColor: "#059669",
  },
  {
    slug: "mu-photographic-society",
    name: "MU Photographic Society",
    category: "Arts & Media",
    shortDescription:
      "Photo walks, exhibitions, and visual storytelling for student photographers.",
    description:
      "MU Photographic Society holds darkroom-to-digital workshops, monthly photo walks across Sylhet, themed contests, and the annual MUPS Exhibition. Beginners learn composition and editing; advanced members publish in the society's annual zine.",
    accentColor: "#475569",
  },
  {
    slug: "mu-robotics-club",
    name: "MU Robotics Club",
    category: "Engineering & Technology",
    shortDescription:
      "Building line-followers, robot soccer bots, and competing in national robotics events.",
    description:
      "MU Robotics Club is where embedded systems, mechatronics, and AI come together. Members learn microcontroller programming, mechanical design, and computer vision while building competition-ready robots for line follower, robo-soccer, and rover challenges.",
    accentColor: "#ea580c",
  },
  {
    slug: "swe-innovators-forum",
    name: "SWE Innovators Forum",
    category: "Software & Industry",
    shortDescription:
      "Software engineering practices, industry talks, and team projects for SWE students.",
    description:
      "SWE Innovators Forum bridges academic SWE coursework with the industry. We run sprints, code review sessions, design pattern workshops, and host engineering managers from leading software companies. Members ship real products as part of long-term team projects.",
    accentColor: "#2563eb",
  },
  {
    slug: "mu-debating-club",
    name: "Metropolitan University Debating Club",
    category: "Diplomacy & Debate",
    shortDescription:
      "British Parliamentary, Asian Parliamentary, and Bangla debating in one home.",
    description:
      "MUDC trains students in argumentation, rhetoric, and critical thinking. We hold weekly debate practices in BP and AP formats, run the MUDC Cup, and represent Metropolitan University at IUTDC, BUDC and other national tournaments.",
    accentColor: "#b91c1c",
  },
  {
    slug: "mugas",
    name: "MU Geography & Astronomical Society",
    category: "Science & Exploration",
    shortDescription:
      "Stargazing, planetary science talks, and geographic field trips across Bangladesh.",
    description:
      "MUGAS combines geography and astronomy in a single curious club. Members join stargazing nights, GIS mapping workshops, planetarium visits, and field trips to Ratargul, Lalakhal, and the Madhabkunda waterfalls. Talks cover everything from black holes to climate change.",
    accentColor: "#312e81",
  },
];

async function main() {
  console.log("[seed] starting…");

  // 1. Overseer admin / admin123
  const adminUsername = "admin";
  const [existingAdmin] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, adminUsername))
    .limit(1);
  let adminId: number;
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    const [created] = await db
      .insert(usersTable)
      .values({
        username: adminUsername,
        passwordHash,
        fullName: "System Overseer",
        email: "overseer@metrouni.edu.bd",
        role: "overseer",
        department: "Office of the Registrar",
      })
      .returning();
    if (!created) throw new Error("Failed to create overseer");
    adminId = created.id;
    console.log("[seed] overseer admin created");
  } else {
    adminId = existingAdmin.id;
    console.log("[seed] overseer admin already exists");
  }

  // 1b. Second overseer (Deputy Overseer)
  const overseer2Username = "overseer2";
  const [existingOverseer2] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, overseer2Username))
    .limit(1);
  if (!existingOverseer2) {
    const passwordHash = await bcrypt.hash("Overseer2@MU", 10);
    await db
      .insert(usersTable)
      .values({
        username: overseer2Username,
        passwordHash,
        fullName: "Deputy Overseer",
        email: "overseer2@metrouni.edu.bd",
        role: "overseer",
        department: "Office of the Registrar",
      });
    console.log("[seed] second overseer created");
  } else {
    console.log("[seed] second overseer already exists");
  }

  // 2. 13 Clubs
  for (const c of CLUBS) {
    const [existing] = await db
      .select()
      .from(clubsTable)
      .where(eq(clubsTable.slug, c.slug))
      .limit(1);
    if (!existing) {
      await db.insert(clubsTable).values({
        slug: c.slug,
        name: c.name,
        category: c.category,
        shortDescription: c.shortDescription,
        description: c.description,
        accentColor: c.accentColor,
        websiteUrl: c.websiteUrl ?? null,
        facebookUrl: c.facebookUrl ?? null,
        instagramUrl: c.instagramUrl ?? null,
      });
    }
  }
  const allClubs = await db.select().from(clubsTable);
  console.log(`[seed] ${allClubs.length} clubs in db`);

  // 2b. One dedicated club admin per club
  const CLUB_ADMINS = [
    { slug: "mu-islamic-society",     username: "admin_muislamic",  password: "MuIslamic@2025",  fullName: "Islamic Society Admin",        email: "admin.islamic@metrouni.edu.bd" },
    { slug: "mu-cse-society",         username: "admin_mucse",       password: "MuCSE@2025",      fullName: "CSE Society Admin",            email: "admin.cse@metrouni.edu.bd" },
    { slug: "mu-sports-club",         username: "admin_musports",    password: "MuSports@2025",   fullName: "Sports Club Admin",            email: "admin.sports@metrouni.edu.bd" },
    { slug: "mu-research-society",    username: "admin_muresearch",  password: "MuResearch@2025", fullName: "Research Society Admin",       email: "admin.research@metrouni.edu.bd" },
    { slug: "mu-hult-prize",          username: "admin_muhult",      password: "MuHult@2025",     fullName: "Hult Prize Admin",             email: "admin.hult@metrouni.edu.bd" },
    { slug: "mu-cultural-club",       username: "admin_mucultural",  password: "MuCultural@2025", fullName: "Cultural Club Admin",          email: "admin.cultural@metrouni.edu.bd" },
    { slug: "mu-mun",                 username: "admin_mumun",       password: "MuMUN@2025",      fullName: "MUN Admin",                    email: "admin.mun@metrouni.edu.bd" },
    { slug: "mu-cycling-association", username: "admin_mucycling",   password: "MuCycling@2025",  fullName: "Cycling Association Admin",    email: "admin.cycling@metrouni.edu.bd" },
    { slug: "mu-photographic-society",username: "admin_muphoto",     password: "MuPhoto@2025",    fullName: "Photographic Society Admin",   email: "admin.photo@metrouni.edu.bd" },
    { slug: "mu-robotics-club",       username: "admin_murobotics",  password: "MuRobotics@2025", fullName: "Robotics Club Admin",          email: "admin.robotics@metrouni.edu.bd" },
    { slug: "swe-innovators-forum",   username: "admin_sweforum",    password: "SweForum@2025",   fullName: "SWE Innovators Admin",         email: "admin.swe@metrouni.edu.bd" },
    { slug: "mu-debating-club",       username: "admin_mudebating",  password: "MuDebating@2025", fullName: "Debating Club Admin",          email: "admin.debating@metrouni.edu.bd" },
    { slug: "mugas",                  username: "admin_mugas",       password: "MuGAS@2025",      fullName: "MUGAS Admin",                  email: "admin.mugas@metrouni.edu.bd" },
  ];
  const clubAdminIdBySlug = new Map<string, number>();
  for (const ca of CLUB_ADMINS) {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, ca.username))
      .limit(1);
    if (existing) {
      clubAdminIdBySlug.set(ca.slug, existing.id);
      continue;
    }
    const passwordHash = await bcrypt.hash(ca.password, 10);
    const [created] = await db
      .insert(usersTable)
      .values({
        username: ca.username,
        passwordHash,
        fullName: ca.fullName,
        email: ca.email,
        role: "club_admin",
        department: "Club Administration",
      })
      .returning();
    if (created) clubAdminIdBySlug.set(ca.slug, created.id);
  }
  console.log(`[seed] ${clubAdminIdBySlug.size} club admin accounts tracked`);

  // 3. Demo students + faculty + a club admin
  const demoUsers = [
    {
      username: "fariha",
      password: "student123",
      fullName: "Fariha Rahman",
      email: "fariha@metrouni.edu.bd",
      role: "student" as const,
      studentId: "MU-CSE-22-104",
      department: "Computer Science & Engineering",
    },
    {
      username: "rakib",
      password: "student123",
      fullName: "Rakib Hasan",
      email: "rakib@metrouni.edu.bd",
      role: "student" as const,
      studentId: "MU-EEE-22-061",
      department: "Electrical & Electronic Engineering",
    },
    {
      username: "tanvir",
      password: "student123",
      fullName: "Tanvir Ahmed",
      email: "tanvir@metrouni.edu.bd",
      role: "student" as const,
      studentId: "MU-BBA-23-018",
      department: "Business Administration",
    },
    {
      username: "samiha",
      password: "student123",
      fullName: "Samiha Chowdhury",
      email: "samiha@metrouni.edu.bd",
      role: "student" as const,
      studentId: "MU-ENG-23-042",
      department: "English",
    },
    {
      username: "ayesha",
      password: "student123",
      fullName: "Ayesha Karim",
      email: "ayesha@metrouni.edu.bd",
      role: "student" as const,
      studentId: "MU-SWE-22-009",
      department: "Software Engineering",
    },
    {
      username: "drimran",
      password: "faculty123",
      fullName: "Dr. Imran Hossain",
      email: "imran.hossain@metrouni.edu.bd",
      role: "faculty" as const,
      department: "Computer Science & Engineering",
    },
    {
      username: "drnusrat",
      password: "faculty123",
      fullName: "Dr. Nusrat Jahan",
      email: "nusrat.jahan@metrouni.edu.bd",
      role: "faculty" as const,
      department: "English",
    },
    {
      username: "shahriar",
      password: "admin1234",
      fullName: "Shahriar Khan",
      email: "shahriar@metrouni.edu.bd",
      role: "club_admin" as const,
      studentId: "MU-CSE-21-015",
      department: "Computer Science & Engineering",
    },
  ];
  const userIdByName = new Map<string, number>();
  for (const u of demoUsers) {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, u.username))
      .limit(1);
    if (existing) {
      userIdByName.set(u.username, existing.id);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 10);
    const [created] = await db
      .insert(usersTable)
      .values({
        username: u.username,
        passwordHash,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        studentId: "studentId" in u ? u.studentId : null,
        department: u.department,
      })
      .returning();
    if (created) userIdByName.set(u.username, created.id);
  }
  console.log(`[seed] ${userIdByName.size} demo users tracked`);

  function clubIdBySlug(slug: string) {
    const c = allClubs.find((x) => x.slug === slug);
    if (!c) throw new Error(`No club ${slug}`);
    return c.id;
  }

  // 4. Memberships — including leadership for CSE Society and a few others
  const memberships: Array<{
    username: string;
    slug: string;
    role: string;
  }> = [
    { username: "shahriar", slug: "mu-cse-society", role: "president" },
    { username: "fariha", slug: "mu-cse-society", role: "vice_president" },
    { username: "rakib", slug: "mu-cse-society", role: "secretary" },
    { username: "ayesha", slug: "mu-cse-society", role: "member" },
    { username: "fariha", slug: "swe-innovators-forum", role: "member" },
    { username: "ayesha", slug: "swe-innovators-forum", role: "president" },
    { username: "rakib", slug: "mu-robotics-club", role: "vice_president" },
    { username: "tanvir", slug: "mu-hult-prize", role: "president" },
    { username: "samiha", slug: "mu-cultural-club", role: "president" },
    { username: "samiha", slug: "mu-debating-club", role: "secretary" },
    { username: "tanvir", slug: "mu-mun", role: "vice_president" },
    { username: "fariha", slug: "mu-photographic-society", role: "member" },
    { username: "rakib", slug: "mu-cycling-association", role: "member" },
  ];
  for (const m of memberships) {
    const userId = userIdByName.get(m.username);
    if (!userId) continue;
    const clubId = clubIdBySlug(m.slug);
    const [existing] = await db
      .select()
      .from(membershipsTable)
      .where(
        sql`${membershipsTable.userId} = ${userId} AND ${membershipsTable.clubId} = ${clubId}`,
      )
      .limit(1);
    if (!existing) {
      await db
        .insert(membershipsTable)
        .values({ userId, clubId, role: m.role });
    }
  }

  // 4b. Per-club admin memberships (president of their club)
  for (const [slug, userId] of clubAdminIdBySlug) {
    const clubId = clubIdBySlug(slug);
    const [existing] = await db
      .select()
      .from(membershipsTable)
      .where(
        sql`${membershipsTable.userId} = ${userId} AND ${membershipsTable.clubId} = ${clubId}`,
      )
      .limit(1);
    if (!existing) {
      await db
        .insert(membershipsTable)
        .values({ userId, clubId, role: "president" });
    }
  }
  console.log("[seed] club admin memberships ensured");

  // 5. A few pending join requests for the dashboards
  const pendingJoins = [
    { username: "tanvir", slug: "mu-cse-society", message: "Curious to learn programming." },
    { username: "samiha", slug: "mu-mun", message: "Interested in committee debate." },
    { username: "ayesha", slug: "mu-photographic-society" },
  ];
  for (const j of pendingJoins) {
    const userId = userIdByName.get(j.username);
    if (!userId) continue;
    const clubId = clubIdBySlug(j.slug);
    const [existing] = await db
      .select()
      .from(joinRequestsTable)
      .where(
        sql`${joinRequestsTable.userId} = ${userId} AND ${joinRequestsTable.clubId} = ${clubId} AND ${joinRequestsTable.status} = 'pending'`,
      )
      .limit(1);
    if (!existing) {
      await db.insert(joinRequestsTable).values({
        userId,
        clubId,
        message: "message" in j ? j.message ?? null : null,
        status: "pending",
      });
    }
  }

  // 6. Events — approved + pending
  const now = new Date();
  const days = (n: number) => new Date(now.getTime() + n * 86400000);
  const eventsSeed: Array<{
    slug: string;
    title: string;
    description: string;
    startsAt: Date;
    venue: string;
    capacity?: number;
    status: "approved" | "pending";
    createdBy: string;
  }> = [
    {
      slug: "mu-cse-society",
      title: "Intra-MU Programming Contest 2026",
      description:
        "An ACM-style contest open to all MU students. Teams of 3, 5 hours, ~10 problems. Prizes for the top 5 teams plus best first-year team.",
      startsAt: days(7),
      venue: "Lab 401, CSE Building",
      capacity: 90,
      status: "approved",
      createdBy: "shahriar",
    },
    {
      slug: "mu-cse-society",
      title: "AI Reading Group: Transformers from Scratch",
      description:
        "Walk through 'Attention Is All You Need' and a minimal PyTorch implementation. Suitable for anyone who has finished an intro ML course.",
      startsAt: days(14),
      venue: "Seminar Room B",
      capacity: 40,
      status: "approved",
      createdBy: "fariha",
    },
    {
      slug: "swe-innovators-forum",
      title: "Software Engineering Career Talk: Life at a Product Company",
      description:
        "An informal talk and Q&A with senior engineers about life after MU — interviews, growth, and product thinking.",
      startsAt: days(10),
      venue: "Auditorium A",
      capacity: 200,
      status: "approved",
      createdBy: "ayesha",
    },
    {
      slug: "mu-mun",
      title: "MUMUN '26: Spring Conference",
      description:
        "Three-day Model UN conference with UNHRC, UNSC, DISEC, and a crisis committee. Open to MU students and select external delegates.",
      startsAt: days(35),
      venue: "MU Main Campus",
      capacity: 250,
      status: "approved",
      createdBy: "tanvir",
    },
    {
      slug: "mu-cultural-club",
      title: "Pohela Boishakh Cultural Night",
      description:
        "Music, dance, poetry, traditional food, and the famous MU Boishakhi Mela on the central lawn.",
      startsAt: days(21),
      venue: "Central Lawn",
      status: "approved",
      createdBy: "samiha",
    },
    {
      slug: "mu-debating-club",
      title: "MUDC Cup — Open Debating Championship",
      description:
        "British Parliamentary format, 5 rounds plus elims. Bn-medium and English-medium brackets.",
      startsAt: days(28),
      venue: "Lecture Theatre 1 & 2",
      capacity: 64,
      status: "pending",
      createdBy: "samiha",
    },
    {
      slug: "mu-cycling-association",
      title: "Sunrise Ride: Lalakhal Loop",
      description:
        "70 km group ride to Lalakhal and back. All riders must bring helmet, lights, and sign safety waiver.",
      startsAt: days(5),
      venue: "Front Gate, MU Campus",
      capacity: 30,
      status: "approved",
      createdBy: "rakib",
    },
    {
      slug: "mu-robotics-club",
      title: "Line Follower Build Sprint",
      description:
        "Two-day sprint where teams of 2 build a line-following robot from a provided kit. Final time trials at end of day 2.",
      startsAt: days(18),
      venue: "Robotics Lab",
      capacity: 24,
      status: "pending",
      createdBy: "rakib",
    },
    {
      slug: "mu-hult-prize",
      title: "Hult Prize MU Qualifier — Finals",
      description:
        "Top 6 teams pitch their social impact ventures to a panel of judges. Winner advances to the regional summit.",
      startsAt: days(40),
      venue: "Auditorium A",
      capacity: 180,
      status: "approved",
      createdBy: "tanvir",
    },
    {
      slug: "mu-research-society",
      title: "Workshop: Writing Your First Conference Paper",
      description:
        "Hands-on workshop covering paper structure, abstract writing, and submission targets for undergraduate conferences.",
      startsAt: days(12),
      venue: "Seminar Room C",
      capacity: 50,
      status: "approved",
      createdBy: "fariha",
    },
    {
      slug: "mu-islamic-society",
      title: "Friday Lecture: Ethics in Daily Student Life",
      description:
        "Open lecture and Q&A. Light refreshments after Maghrib.",
      startsAt: days(3),
      venue: "Prayer Hall",
      status: "approved",
      createdBy: "shahriar",
    },
    {
      slug: "mu-photographic-society",
      title: "MUPS Photo Walk: Old Sylhet",
      description:
        "Half-day walk through Bandarbazar and Surma riverside. All cameras (and phones) welcome.",
      startsAt: days(-7),
      venue: "Front Gate, 7am",
      status: "approved",
      createdBy: "fariha",
    },
    {
      slug: "mugas",
      title: "Stargazing Night at the Quad",
      description:
        "Telescopes set up on the Central Quad. Brief talk on Jupiter's moons and the winter sky.",
      startsAt: days(9),
      venue: "Central Quad",
      capacity: 120,
      status: "approved",
      createdBy: "rakib",
    },
  ];
  const [{ existingEventCount }] = (await db
    .select({ existingEventCount: sql<number>`count(*)::int` })
    .from(eventsTable)) as Array<{ existingEventCount: number }>;
  if (Number(existingEventCount) === 0) {
    for (const e of eventsSeed) {
      const createdById = userIdByName.get(e.createdBy) ?? adminId;
      await db.insert(eventsTable).values({
        clubId: clubIdBySlug(e.slug),
        createdById,
        title: e.title,
        description: e.description,
        startsAt: e.startsAt,
        venue: e.venue,
        capacity: e.capacity ?? null,
        status: e.status,
        approvedById: e.status === "approved" ? adminId : null,
      });
    }
    console.log(`[seed] ${eventsSeed.length} events seeded`);
  }

  // 7. Posts
  const postsSeed: Array<{
    slug: string;
    title: string;
    body: string;
    author: string;
  }> = [
    {
      slug: "mu-cse-society",
      title: "Welcome new members — Spring intake",
      body: "We're excited to welcome 38 new members this semester. Orientation will run alongside our weekly Friday meetups in Lab 401. Bring your laptop.",
      author: "shahriar",
    },
    {
      slug: "mu-cse-society",
      title: "Recap: Hackathon 2025 — what we built",
      body: "37 teams shipped projects across health, climate, and EdTech. Highlights included a Bangla sign-language translator and a flood-warning IoT prototype. Full project gallery on the events page.",
      author: "fariha",
    },
    {
      slug: "mu-cultural-club",
      title: "Auditions open: Boishakh Drama",
      body: "Auditions open for our annual Pohela Boishakh play. No experience required — we will run two improv warm-up sessions before the auditions.",
      author: "samiha",
    },
    {
      slug: "mu-debating-club",
      title: "Beginner's guide to BP",
      body: "Curious about British Parliamentary debating? Here's a one-page primer covering roles, structure, and what makes a great extension.",
      author: "samiha",
    },
    {
      slug: "mu-mun",
      title: "Position paper template — MUMUN '26",
      body: "We've published the official position paper template and rubric for MUMUN '26 delegates. Read it carefully before submitting.",
      author: "tanvir",
    },
    {
      slug: "mu-photographic-society",
      title: "Photo of the week — golden hour at Ratargul",
      body: "Featured shot by Fariha Rahman from our last weekend trip. Captured on Fuji X-T30 — story behind the shot inside.",
      author: "fariha",
    },
  ];
  const [{ existingPostCount }] = (await db
    .select({ existingPostCount: sql<number>`count(*)::int` })
    .from(postsTable)) as Array<{ existingPostCount: number }>;
  if (Number(existingPostCount) === 0) {
    for (const p of postsSeed) {
      const authorId = userIdByName.get(p.author) ?? adminId;
      await db.insert(postsTable).values({
        clubId: clubIdBySlug(p.slug),
        authorId,
        title: p.title,
        body: p.body,
      });
    }
  }

  // 8. Notices — university + club
  const noticesSeed: Array<{
    slug?: string;
    title: string;
    body: string;
    scope: "club" | "university";
    pinned?: boolean;
    audienceRole?: string;
  }> = [
    {
      title: "Spring 2026 semester registration is now open",
      body: "All students must complete course registration by April 15. Late registrations require approval from the Registrar's Office.",
      scope: "university",
      pinned: true,
    },
    {
      title: "Library extended hours during finals week",
      body: "The Central Library will remain open until 1am from May 5 through May 19 for final exam preparation.",
      scope: "university",
    },
    {
      title: "Faculty meeting — academic council",
      body: "Reminder: monthly academic council meets May 2, 11am, Boardroom 3. Department heads only.",
      scope: "university",
      audienceRole: "faculty",
    },
    {
      slug: "mu-cse-society",
      title: "Lab 401 is reserved for the contest on Saturday",
      body: "Please plan personal study time elsewhere on Saturday from 9am–4pm.",
      scope: "club",
      pinned: true,
    },
    {
      slug: "mu-cultural-club",
      title: "Costume measurements this Wednesday",
      body: "All performers please come to the green room on Wednesday between 4–6pm for fittings.",
      scope: "club",
    },
    {
      slug: "mu-mun",
      title: "Delegate fee waiver — last day to apply",
      body: "Need-based fee waivers close at midnight on Friday. Please submit your application via the secretariat.",
      scope: "club",
    },
  ];
  const [{ existingNoticeCount }] = (await db
    .select({ existingNoticeCount: sql<number>`count(*)::int` })
    .from(noticesTable)) as Array<{ existingNoticeCount: number }>;
  if (Number(existingNoticeCount) === 0) {
    for (const n of noticesSeed) {
      await db.insert(noticesTable).values({
        clubId: n.slug ? clubIdBySlug(n.slug) : null,
        authorId: adminId,
        title: n.title,
        body: n.body,
        scope: n.scope,
        pinned: n.pinned ?? false,
        publishAt: new Date(),
        audienceRole: n.audienceRole ?? null,
      });
    }
  }

  console.log("[seed] done");
  await pool.end();
}

main().catch((err) => {
  console.error("[seed] failed", err);
  process.exit(1);
});
