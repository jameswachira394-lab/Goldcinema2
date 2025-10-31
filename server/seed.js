// seed.js
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");

const DB_FILE = path.join(__dirname, "db.sqlite");
const db = new sqlite3.Database(DB_FILE);

const movies = [
  {
    title: "Oppenheimer",
    category: "Movie",
    description: "A historical drama about J. Robert Oppenheimer and the atomic bomb.",
    poster: "https://m.media-amazon.com/images/M/MV5B...Oppenheimer.jpg",
    duration: 180
  },
  {
    title: "The Batman",
    category: "Movie",
    description: "Dark and gritty detective story set in Gotham.",
    poster: "https://m.media-amazon.com/images/M/MV5B...TheBatman.jpg",
    duration: 155
  },
  {
    title: "Attack on Titan",
    category: "Anime",
    description: "Humanity fights titans in this dark fantasy anime.",
    poster: "https://m.media-amazon.com/images/M/MV5B...AOT.jpg",
    duration: 25
  },
  {
    title: "Demon Slayer",
    category: "Anime",
    description: "A boy battles demons to save his sister and humanity.",
    poster: "https://m.media-amazon.com/images/M/MV5B...DemonSlayer.jpg",
    duration: 624
  },
  {
    title: "Spider-Man: Across the Spider-Verse",
    category: "Movie",
    description: "Miles Morales returns for a visually stunning multiverse adventure.",
    poster: "https://m.media-amazon.com/images/M/SpiderVerse.jpg",
    duration: 140
  },
  {
    title: "Avatar: The Way of Water",
    category: "Movie",
    description: "Continuing the epic saga of Pandora with breathtaking underwater visuals.",
    poster: "https://m.media-amazon.com/images/M/AvatarWayOfWater.jpg",
    duration: 192
  },
  {
    title: "Everything Everywhere All at Once",
    category: "Movie",
    description: "A wildly inventive film about family, identity, and multiverse chaos.",
    poster: "https://m.media-amazon.com/images/M/EverythingEverywhere.jpg",
    duration: 140
  },
  {
    title: "Spirited Away",
    category: "Anime",
    description: "A young girl's journey through a mysterious spirit world (Studio Ghibli classic).",
    poster: "https://m.media-amazon.com/images/M/SpiritedAway.jpg",
    duration: 125
  },
  {
    title: "My Neighbor Totoro",
    category: "Anime",
    description: "A gentle, magical tale of two sisters and forest spirits.",
    poster: "https://m.media-amazon.com/images/M/Totoro.jpg",
    duration: 286
  },
  {
    title: "Jujutsu Kaisen 0",
    category: "Anime",
    description: "A prequel movie exploring the origins and dark battles of the Jujutsu world.",
    poster: "https://m.media-amazon.com/images/M/JujutsuKaisen0.jpg",
    duration: 105
  },
  {
    title: "Parasite",
    category: "Movie",
    description: "A darkly comic thriller about class divisions that spirals into chaos.",
    poster: "https://m.media-amazon.com/images/M/Parasite.jpg",
    duration: 132
  }
];

async function seedDatabase() {
  const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
      console.error('Error opening database', err.message);
      return;
    }
    console.log('Connected to the SQLite database.');
  });

  // Use a Promise-based wrapper for db.run
  const run = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

  try {
    // Remove existing duplicate movies (keep the first occurrence) so creating a UNIQUE index succeeds
    await run(`DELETE FROM movies WHERE id NOT IN (SELECT MIN(id) FROM movies GROUP BY title)`);
    console.log("Removed duplicate movies.");

    // Ensure movie titles are unique so we can safely use INSERT OR IGNORE
    await run("CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_title ON movies(title)");
    console.log("Created unique index on movies.title.");

    const stmt = db.prepare("INSERT OR IGNORE INTO movies (title, category, description, poster, duration) VALUES (?, ?, ?, ?, ?)");
    for (const m of movies) {
      await new Promise((resolve, reject) => {
        stmt.run(m.title, m.category, m.description, m.poster, m.duration, (err) => err ? reject(err) : resolve());
      });
    }
    stmt.finalize();
    console.log("✅ Movies & Anime inserted (duplicates ignored)!");

    // now create admin user (hash password first)
    const hashed = await bcrypt.hash("admin123", 10);
    await run("INSERT OR IGNORE INTO users (email, username, password, role) VALUES (?, ?, ?, ?)", ["admin@goldcinema.com", "admin", hashed, "admin"]);
    console.log("✅ Admin user created (username: admin, password: admin123)");
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    db.close(() => console.log('Database connection closed.'));
  }
}

seedDatabase();
