// seed.js
const sqlite3 = require("sqlite3").verbose();
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
    duration: 24
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
    duration: 86
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

db.serialize(() => {
  // Remove existing duplicate movies (keep the first occurrence) so creating a UNIQUE index succeeds
  db.run(`DELETE FROM movies WHERE id NOT IN (SELECT MIN(id) FROM movies GROUP BY title)`, function (delErr) {
    if (delErr) {
      console.error('Error removing duplicate movies:', delErr);
      // continue anyway
    }

    // Ensure movie titles are unique so we can safely use INSERT OR IGNORE
    db.run("CREATE UNIQUE INDEX IF NOT EXISTS idx_movies_title ON movies(title)", function (idxErr) {
      if (idxErr) {
        console.error('Error creating unique index on movies.title:', idxErr);
        // continue; INSERT OR IGNORE may still work without the index
      }

      const stmt = db.prepare("INSERT OR IGNORE INTO movies (title, category, description, poster, duration) VALUES (?, ?, ?, ?, ?)");
      movies.forEach(m => {
        // Provide a callback to handle potential constraint errors gracefully
        stmt.run(m.title, m.category, m.description, m.poster, m.duration, function (runErr) {
          if (runErr) {
            // Log and continue (duplicates or other constraint issues)
            console.warn('Could not insert movie', m.title, runErr && runErr.message);
          }
        });
      });

  // finalize only after all movie inserts queued
  stmt.finalize((err) => {
    if (err) {
      console.error('Error finalizing movie statement:', err);
      db.close();
      return;
    }

    console.log("✅ Movies & Anime inserted (duplicates ignored)!");

    // now create admin user (hash password first)
    const bcrypt = require("bcrypt");
    (async () => {
      try {
        const hashed = await bcrypt.hash("admin123", 10);
        db.run(
          "INSERT OR IGNORE INTO users (email, username, password, role) VALUES (?, ?, ?, ?)",
          ["admin@goldcinema.com", "admin", hashed, "admin"],
          function (err2) {
            if (err2) {
              console.error('Error inserting admin user:', err2);
            } else {
              console.log("✅ Admin user created (username: admin, password: admin123)");
            }
            db.close();
          }
        );
      } catch (hashErr) {
        console.error('Error hashing password:', hashErr);
        db.close();
      }
    })();
  });
      });
  });
});
