import "dotenv/config";
import bcrypt from "bcryptjs";
import {
  connectDB,
  User,
  Club,
  Membership,
  Event,
  Notice,
  Post,
  JoinRequest,
} from "@workspace/db";

async function upsertUser(data: {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: string;
  studentId?: string | null;
  department?: string | null;
  batch?: string | null;
}) {
  const existing = await User.findOne({ username: data.username.toLowerCase() }).lean();
  if (existing) return existing;
  const passwordHash = await bcrypt.hash(data.password, 10);
  const created = await User.create({
    username: data.username.toLowerCase(),
    passwordHash,
    fullName: data.fullName,
    email: data.email,
    role: data.role,
    studentId: data.studentId ?? null,
    department: data.department ?? null,
    batch: data.batch ?? null,
  });
  return created.toObject();
}

async function upsertClub(data: {
  slug: string;
  name: string;
  category: string;
  shortDescription: string;
  description: string;
  accentColor: string;
}) {
  const existing = await Club.findOne({ slug: data.slug }).lean();
  if (existing) return existing;
  const created = await Club.create(data);
  return created.toObject();
}

async function upsertMembership(data: {
  userId: string;
  clubId: string;
  role: string;
}) {
  const existing = await Membership.findOne({
    userId: data.userId,
    clubId: data.clubId,
  }).lean();
  if (existing) return existing;
  const created = await Membership.create({
    ...data,
    joinedAt: new Date(),
  });
  return created.toObject();
}

function s(id: any): string {
  return id.toString();
}

async function seed() {
  await connectDB();
  console.log("[seed] Connected to MongoDB");

  // ── OVERSEER ──────────────────────────────────────────────
  const admin = await upsertUser({
    username: "admin",
    password: "admin123",
    fullName: "System Administrator",
    email: "admin@mu.edu",
    role: "overseer",
  });
  console.log("[seed] Overseer: admin / admin123");

  // ── CLUBS ─────────────────────────────────────────────────
  const clubsData = [
    {
      slug: "mu-robotics",
      name: "MU Robotics Club",
      category: "Technology",
      shortDescription: "Building the robots of tomorrow, today.",
      description:
        "The MU Robotics Club brings together students passionate about robotics and automation. We participate in national competitions, run workshops, and collaborate on cutting-edge projects.",
      accentColor: "#0ea5e9",
    },
    {
      slug: "mu-photography",
      name: "MU Photography Society",
      category: "Arts",
      shortDescription: "Capturing moments, telling stories.",
      description:
        "A community for photography enthusiasts at Metropolitan University. We organize photo walks, exhibitions, and skill-building workshops for all experience levels.",
      accentColor: "#8b5cf6",
    },
    {
      slug: "mu-debate",
      name: "MU Debate Society",
      category: "Academic",
      shortDescription: "Sharpening minds through structured argument.",
      description:
        "The MU Debate Society trains students in critical thinking, public speaking, and argumentation. We compete in inter-university tournaments and host open debates on campus.",
      accentColor: "#f59e0b",
    },
    {
      slug: "mu-music",
      name: "MU Music Club",
      category: "Arts",
      shortDescription: "Where passion meets harmony.",
      description:
        "A vibrant community for musicians and music lovers. We perform at university events, run jam sessions, and support students in developing their musical talents.",
      accentColor: "#ec4899",
    },
    {
      slug: "mu-entrepreneurship",
      name: "MU Entrepreneurship Cell",
      category: "Business",
      shortDescription: "Turning ideas into ventures.",
      description:
        "E-Cell provides aspiring entrepreneurs with mentorship, networking, and resources to launch their startups. We organize hackathons, pitch competitions, and founder talks.",
      accentColor: "#10b981",
    },
  ];

  const clubs: Record<string, any> = {};
  for (const cd of clubsData) {
    clubs[cd.slug] = await upsertClub(cd);
    console.log(`[seed] Club: ${cd.name}`);
  }

  // ── CLUB ADMINS ───────────────────────────────────────────
  const adminData = [
    {
      username: "robotics_president",
      password: "pass1234",
      fullName: "Arjun Sharma",
      email: "arjun@mu.edu",
      role: "club_admin",
      studentId: "2021-CSE-001",
      department: "Computer Science",
      batch: "2021",
      clubSlug: "mu-robotics",
      memberRole: "president",
    },
    {
      username: "photo_president",
      password: "pass1234",
      fullName: "Priya Nair",
      email: "priya@mu.edu",
      role: "club_admin",
      studentId: "2020-ART-007",
      department: "Fine Arts",
      batch: "2020",
      clubSlug: "mu-photography",
      memberRole: "president",
    },
    {
      username: "debate_president",
      password: "pass1234",
      fullName: "Kabir Hassan",
      email: "kabir@mu.edu",
      role: "club_admin",
      studentId: "2021-ENG-012",
      department: "English",
      batch: "2021",
      clubSlug: "mu-debate",
      memberRole: "president",
    },
    {
      username: "music_president",
      password: "pass1234",
      fullName: "Meera Krishnan",
      email: "meera@mu.edu",
      role: "club_admin",
      studentId: "2022-MUS-003",
      department: "Music",
      batch: "2022",
      clubSlug: "mu-music",
      memberRole: "president",
    },
    {
      username: "ecell_president",
      password: "pass1234",
      fullName: "Rohan Verma",
      email: "rohan@mu.edu",
      role: "club_admin",
      studentId: "2020-MBA-015",
      department: "Business Administration",
      batch: "2020",
      clubSlug: "mu-entrepreneurship",
      memberRole: "president",
    },
  ];

  for (const ad of adminData) {
    const u = await upsertUser({
      username: ad.username,
      password: ad.password,
      fullName: ad.fullName,
      email: ad.email,
      role: ad.role,
      studentId: ad.studentId,
      department: ad.department,
      batch: ad.batch,
    });
    const club = clubs[ad.clubSlug];
    if (club) {
      await upsertMembership({
        userId: s(u._id),
        clubId: s(club._id),
        role: ad.memberRole,
      });
    }
    console.log(`[seed] Club admin: ${ad.username} / pass1234`);
  }

  // ── SAMPLE STUDENTS ───────────────────────────────────────
  const students = [
    {
      username: "alice",
      password: "pass1234",
      fullName: "Alice Chen",
      email: "alice@mu.edu",
      role: "student",
      studentId: "2022-CSE-101",
      department: "Computer Science",
      batch: "2022",
    },
    {
      username: "bob",
      password: "pass1234",
      fullName: "Bob Martinez",
      email: "bob@mu.edu",
      role: "student",
      studentId: "2023-EEE-055",
      department: "Electrical Engineering",
      batch: "2023",
    },
    {
      username: "carol",
      password: "pass1234",
      fullName: "Carol Davis",
      email: "carol@mu.edu",
      role: "student",
      studentId: "2021-MED-200",
      department: "Medical",
      batch: "2021",
    },
  ];

  const studentDocs: any[] = [];
  for (const sd of students) {
    const u = await upsertUser(sd);
    studentDocs.push(u);
    console.log(`[seed] Student: ${sd.username} / pass1234`);
  }

  // Enroll alice in robotics and photography
  if (clubs["mu-robotics"] && studentDocs[0]) {
    await upsertMembership({
      userId: s(studentDocs[0]._id),
      clubId: s(clubs["mu-robotics"]._id),
      role: "member",
    });
    await upsertMembership({
      userId: s(studentDocs[0]._id),
      clubId: s(clubs["mu-photography"]._id),
      role: "member",
    });
  }

  // ── EVENTS ────────────────────────────────────────────────
  const roboticsClub = clubs["mu-robotics"];
  const debateClub = clubs["mu-debate"];

  if (roboticsClub) {
    const adminUser = await User.findOne({ username: "robotics_president" }).lean();
    const existingEvent = await Event.findOne({
      clubId: s(roboticsClub._id),
      title: "Annual Robotics Showcase 2025",
    }).lean();
    if (!existingEvent && adminUser) {
      await Event.create({
        clubId: s(roboticsClub._id),
        title: "Annual Robotics Showcase 2025",
        description:
          "Our biggest event of the year! See the robots our members have built over the past semester. Open to all students and faculty. Cash prizes for top 3 teams.",
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        venue: "Main Auditorium",
        capacity: 200,
        status: "approved",
        createdById: s(adminUser._id),
        approvedById: s(admin._id),
      });
      console.log("[seed] Event: Annual Robotics Showcase 2025");
    }

    const existingWorkshop = await Event.findOne({
      clubId: s(roboticsClub._id),
      title: "Arduino for Beginners Workshop",
    }).lean();
    if (!existingWorkshop && adminUser) {
      await Event.create({
        clubId: s(roboticsClub._id),
        title: "Arduino for Beginners Workshop",
        description:
          "New to hardware? Join us for a hands-on workshop where you'll learn the basics of Arduino and build your first circuit!",
        startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        venue: "Lab 301, Engineering Block",
        capacity: 30,
        status: "approved",
        createdById: s(adminUser._id),
        approvedById: s(admin._id),
      });
      console.log("[seed] Event: Arduino for Beginners Workshop");
    }
  }

  if (debateClub) {
    const adminUser = await User.findOne({ username: "debate_president" }).lean();
    const existingEvent = await Event.findOne({
      clubId: s(debateClub._id),
      title: "Inter-University Debate Championship 2025",
    }).lean();
    if (!existingEvent && adminUser) {
      await Event.create({
        clubId: s(debateClub._id),
        title: "Inter-University Debate Championship 2025",
        description:
          "MU hosts the annual inter-university debate championship. 12 universities competing. Motion: 'This House Believes AI Will Eliminate More Jobs Than It Creates.'",
        startsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
        venue: "Seminar Hall B",
        capacity: 150,
        status: "pending",
        createdById: s(adminUser._id),
      });
      console.log("[seed] Event: Inter-University Debate Championship 2025");
    }
  }

  // ── NOTICES ───────────────────────────────────────────────
  const overseerUser = admin;
  const existingGlobalNotice = await Notice.findOne({
    scope: "university",
    title: "Welcome to the New Club Portal",
  }).lean();
  if (!existingGlobalNotice) {
    await Notice.create({
      authorId: s(overseerUser._id),
      title: "Welcome to the New Club Portal",
      body: "We are excited to launch the Metropolitan University Club Management Portal. Browse clubs, join activities, and stay connected with your campus community!",
      scope: "university",
      pinned: true,
      publishAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });
    console.log("[seed] Notice: Welcome to the New Club Portal");
  }

  if (roboticsClub) {
    const adminUser = await User.findOne({ username: "robotics_president" }).lean();
    const existingNotice = await Notice.findOne({
      clubId: s(roboticsClub._id),
      title: "New Member Orientation",
    }).lean();
    if (!existingNotice && adminUser) {
      await Notice.create({
        clubId: s(roboticsClub._id),
        authorId: s(adminUser._id),
        title: "New Member Orientation",
        body: "All new members are invited to attend our orientation session this Saturday at 3 PM in the Engineering Block common room. Bring your laptops!",
        scope: "club",
        pinned: false,
        publishAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      });
      console.log("[seed] Notice: New Member Orientation");
    }
  }

  // ── POSTS ─────────────────────────────────────────────────
  if (roboticsClub) {
    const adminUser = await User.findOne({ username: "robotics_president" }).lean();
    const existingPost = await Post.findOne({
      clubId: s(roboticsClub._id),
      title: "We Won the National Robotics Competition!",
    }).lean();
    if (!existingPost && adminUser) {
      await Post.create({
        clubId: s(roboticsClub._id),
        authorId: s(adminUser._id),
        title: "We Won the National Robotics Competition!",
        body: "Incredibly proud to announce that Team MU-Bot has won first place at the National Robotics Competition held in Dhaka. Our autonomous navigation system impressed the judges and outperformed 24 other teams. Congratulations to all team members!",
      });
      console.log("[seed] Post: We Won the National Robotics Competition!");
    }
  }

  // ── JOIN REQUESTS ─────────────────────────────────────────
  if (debateClub && studentDocs[1]) {
    const existingReq = await JoinRequest.findOne({
      userId: s(studentDocs[1]._id),
      clubId: s(debateClub._id),
    }).lean();
    if (!existingReq) {
      await JoinRequest.create({
        userId: s(studentDocs[1]._id),
        clubId: s(debateClub._id),
        message: "I have been following competitive debate since high school. Eager to join!",
        status: "pending",
      });
      console.log("[seed] Join request: bob → mu-debate");
    }
  }

  console.log("\n[seed] ✓ Seeding complete!");
  console.log("[seed] Default login — overseer: admin / admin123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[seed] Error:", err);
  process.exit(1);
});
