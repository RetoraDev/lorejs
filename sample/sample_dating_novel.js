/**
 * HEARTBEAT HIGH SCHOOL - Otaku Romance Visual Novel for LoreJS
 *
 * AUTHOR: RetoraDev
 * GENRE: School Romance / Visual Novel
 *
 * STORY SYNOPSIS:
 * You're a transfer student at Heartbeat High School, where cherry blossoms bloom
 * and young hearts flutter. Three unique girls await your attention, each with
 * their own dreams and personalities. Will you find love before graduation day?
 *
 */

let flags = {
  firstMorning: false,
  day: 1,
  sakuraAffection: 0,
  yukiAffection: 0,
  hanaAffection: 0
};

module.exports = {
  title: "{{magenta}}Heartbeat High School: Three Years Under Blossoms{{font_reset}}",
  startRoom: "bedroom",
  rooms: [
    // HOME LOCATIONS
    {
      id: "bedroom",
      name: "{{bold}}{{blue}}Your Bedroom{{font_reset}}",
      description: "Your {{italic}}cozy{{font_reset}} bedroom. A desk with school supplies, a comfortable bed, and a window overlooking the neighborhood. You can go to the {{yellow}}kitchen{{color_reset}} or head to {{yellow}}school{{color_reset}}. Type {{cyan}}use bed{{color_reset}} to end the day.",
      exits: {
        kitchen: "kitchen",
        school: "school_gate"
      },
      items: ["alarm_clock", "bed"],
      tutorials: ["go", "save", "load", "help"],
      onEnter: (state, engine) => {
        if (!flags.firstMorning) {
          engine.printLine("{{cyan}}The morning sun filters through your window. It's your first day at Heartbeat High School.{{color_reset}}");
          flags.firstMorning  = true;
        }
      }
    },
    {
      id: "kitchen",
      name: "{{bold}}{{yellow}}Kitchen{{font_reset}}",
      description: "A warm, inviting kitchen. The smell of breakfast fills the air. You can return to your {{yellow}}bedroom{{color_reset}}.",
      exits: {
        bedroom: "bedroom",
        school: "school_gate"
      },
      characters: ["mother"],
      tutorial: "talk",
      onEnter: (state, engine) => {
        if (flags.day === 1 && !flags.metMother) {
          engine.printLine("{{yellow}}Your mother is preparing breakfast at the counter.{{color_reset}}");
        }
      }
    },

    // SCHOOL EXTERIOR
    {
      id: "school_gate",
      name: "{{bold}}{{green}}School Gate{{font_reset}}",
      description: "The main gate of Heartbeat High School. Cherry blossom trees line the path. Students stream through the gates. You can enter the {{yellow}}main building{{color_reset}} or return {{yellow}}home{{color_reset}}.",
      exits: {
        home: "bedroom",
        building: "main_hall"
      },
      tutorial: "talk",
      characters: ["school_guard"],
      onEnter: (state, engine) => {
        if (flags.day === 10 && !flags.graduationTriggered) {
          // Trigger graduation ending
          engine.printLine("{{bold}}{{cyan}}*** GRADUATION CEREMONY ***{{font_reset}}");
          engine.printLine("{{cyan}}As you approach the school gates, you see all the students in their graduation robes.{{color_reset}}");
          engine.printLine("{{cyan}}Today marks the end of your three years at Heartbeat High School.{{color_reset}}");
          flags.graduationTriggered = true;

          // Small delay before showing the ending
          setTimeout(() => {
            triggerGraduation(state, engine);
          }, 2000);
        } else if (flags.day < 10) {
          engine.printLine(`{{cyan}}Day ${flags.day} of your high school life begins.{{color_reset}}`);
        }
      }
    },

    // SCHOOL INTERIOR
    {
      id: "main_hall",
      name: "{{bold}}{{red}}Main Hall{{font_reset}}",
      description: "The bustling main hall of the school. Students gather around lockers and notice boards. You can go to your {{yellow}}classroom{{color_reset}}, the {{yellow}}courtyard{{color_reset}}, {{yellow}}library{{color_reset}}, or {{yellow}}cafeteria{{color_reset}}.",
      exits: {
        classroom: "classroom",
        courtyard: "courtyard",
        library: "library",
        cafeteria: "cafeteria",
        gate: "school_gate"
      },
      characters: ["student_council_president", "random_student1", "random_student2"]
    },
    {
      id: "classroom",
      name: "{{bold}}{{blue}}Class 2-B Classroom{{font_reset}}",
      description: "Your classroom with rows of wooden desks. Sunlight streams through large windows. You can go to the {{yellow}}main hall{{color_reset}} or visit the {{yellow}}rooftop{{color_reset}}.",
      exits: {
        hall: "main_hall",
        rooftop: "rooftop"
      },
      tutorials: ["take", "use"],
      items: ["math_textbook", "love_letter"],
      characters: ["class_rep"],
      onEnter: (state, engine) => {
        if (flags.day === 1 && !flags.firstClass) {
          engine.printLine("{{blue}}This will be your classroom for the next three years.{{color_reset}}");
          flags.firstClass = true;
        }
      }
    },
    {
      id: "courtyard",
      name: "{{bold}}{{green}}School Courtyard{{font_reset}}",
      description: "A beautiful courtyard dominated by a massive {{pink}}cherry blossom tree{{color_reset}}. Students relax on benches under falling petals. You can return to the {{yellow}}main hall{{color_reset}}.",
      exits: {
        hall: "main_hall"
      },
      tutorial: "look",
      characters: ["hana", "art_club_member"],
      items: ["cherry_tree", "school_well"]
    },
    {
      id: "library",
      name: "{{bold}}{{magenta}}School Library{{font_reset}}",
      description: "A quiet library filled with tall bookshelves. The smell of old paper fills the air. You can go back to the {{yellow}}main hall{{color_reset}}.",
      exits: {
        hall: "main_hall"
      },
      tutorial: "look",
      characters: ["yuki", "librarian"],
      items: ["romance_novel", "study_desk"]
    },
    {
      id: "cafeteria",
      name: "{{bold}}{{yellow}}School Cafeteria{{font_reset}}",
      description: "A noisy cafeteria filled with the smell of lunch. Students chat at long tables. You can return to the {{yellow}}main hall{{color_reset}}.",
      exits: {
        hall: "main_hall"
      },
      characters: ["sakura", "lunch_lady", "random_student3"],
      items: ["vending_machine"]
    },
    {
      id: "rooftop",
      name: "{{bold}}{{cyan}}School Rooftop{{font_reset}}",
      description: "The school rooftop offers a stunning view of the city. A perfect escape from crowded hallways. You can go back to the {{yellow}}classroom{{color_reset}}.",
      exits: {
        classroom: "classroom"
      },
      characters: ["rooftop_couple"],
      onEnter: (state, engine) => {
        if (!flags.visitedRooftop) {
          engine.printLine("{{cyan}}The wind feels refreshing up here. You can see the entire school grounds.{{color_reset}}");
          flags.visitedRooftop = true;
        }
      }
    },
    {
      id: "sports_field",
      name: "{{bold}}{{red}}Sports Field{{font_reset}}",
      description: "A vast sports field where athletic students train. The track team runs laps in the distance. You can return to the {{yellow}}main hall{{color_reset}}.",
      exits: {
        hall: "main_hall"
      },
      characters: ["sports_captain", "track_member"]
    },
    {
      id: "music_room",
      name: "{{bold}}{{purple}}Music Room{{font_reset}}",
      description: "A soundproofed room filled with instruments. Sheet music litters the stands. You can return to the {{yellow}}main hall{{color_reset}}.",
      exits: {
        hall: "main_hall"
      },
      characters: ["music_president"],
      items: ["piano"]
    }
  ],
  items: [
    {
      id: "math_textbook",
      name: "{{blue}}Math Textbook{{color_reset}}",
      shortName: "{{blue}}Textbook{{color_reset}}",
      aliases: ["textbook", "math book", "calculus book"],
      takeable: true,
      description: "Your mathematics textbook. It's surprisingly heavy.",
      use: (state, engine) => {
        engine.printLine("You flip through the math textbook. The equations make your head spin.");
        if (flags.yukiAffection > 0) {
          engine.printLine("{{blue}}You remember Yuki offering to help you study...{{color_reset}}");
        }
        return true;
      }
    },
    {
      id: "love_letter",
      name: "{{magenta}}Mysterious Letter{{color_reset}}",
      shortName: "{{magenta}}Letter{{color_reset}}",
      aliases: ["letter", "note", "mysterious letter"],
      takeable: true,
      description: "An anonymous love letter you found in your desk. Who could it be from?",
      use: (state, engine) => {
        engine.printLine("{{magenta}}The letter reads: 'My heart beats faster every time I see you. Meet me after school in the courtyard. ♡'{{color_reset}}");
        if (!flags.readLoveLetter) {
          engine.printLine("{{cyan}}Your face feels warm. Someone has a crush on you!{{color_reset}}");
          flags.readLoveLetter = true;
        }
        return true;
      }
    },
    {
      id: "cherry_blossom_petal",
      name: "{{pink}}Cherry Blossom Petal{{color_reset}}",
      shortName: "{{pink}}Petal{{color_reset}}",
      aliases: ["petal", "blossom", "flower"],
      takeable: true,
      description: "A single, perfect cherry blossom petal.",
      use: (state, engine) => {
        const room = engine.world.rooms.get(state.currentRoom);
        if (room.characters && room.characters.includes("hana")) {
          engine.printLine("{{pink}}You offer the cherry blossom petal to Hana. She smiles warmly.{{color_reset}}");
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'It's beautiful... thank you. ♡'{{color_reset}}");
          if (!flags.gaveFlowerToHana) {
            flags.hanaAffection += 2;
            flags.gaveFlowerToHana = true;
            engine.printLine("{{green}}[Hana's affection increased!]{{color_reset}}");
          }
          const itemIndex = state.inventory.indexOf("cherry_blossom_petal");
          if (itemIndex > -1) state.inventory.splice(itemIndex, 1);
        } else {
          engine.printLine("The cherry blossom petal is beautiful, but there's no one to share it with right now.");
        }
        return true;
      }
    },
    {
      id: "romance_novel",
      name: "{{red}}Romance Novel{{color_reset}}",
      shortName: "{{red}}Novel{{color_reset}}",
      aliases: ["novel", "book", "love story"],
      takeable: true,
      description: "A shoujo romance novel with a dramatic cover.",
      use: (state, engine) => {
        const room = engine.world.rooms.get(state.currentRoom);
        if (room.characters && room.characters.includes("yuki")) {
          engine.printLine("{{blue}}You show the romance novel to Yuki. She adjusts her glasses.{{color_reset}}");
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'That's... not the kind of literature I usually read.' But you notice her blushing.{{color_reset}}");
          if (!flags.showedNovelToYuki) {
            flags.yukiAffection += 1;
            flags.showedNovelToYuki = true;
            engine.printLine("{{blue}}[Yuki's affection increased!]{{color_reset}}");
          }
        } else {
          engine.printLine("You read a few pages. The story is surprisingly engaging.");
        }
        return true;
      }
    },
    {
      id: "alarm_clock",
      name: "{{yellow}}Alarm Clock{{color_reset}}",
      shortName: "{{yellow}}Clock{{color_reset}}",
      aliases: ["clock", "alarm"],
      takeable: false,
      description: "A digital alarm clock that wakes you up every morning.",
      use: (state, engine) => {
        const room = engine.world.rooms.get(state.currentRoom);
        if (room.id === "bedroom") {
          engine.printLine("{{yellow}}You check the time on your alarm clock.{{color_reset}}");
          if (flags.day < 10) {
            engine.printLine(`{{cyan}}It's day ${flags.day}. The alarm is set for tomorrow morning.{{color_reset}}`);
          } else {
            engine.printLine("{{cyan}}Tomorrow is graduation day. How time flies...{{color_reset}}");
          }
        } else {
          engine.printLine("The alarm clock doesn't seem relevant here.");
        }
        return true;
      }
    },
    {
      id: "bed",
      name: "{{blue}}Comfortable Bed{{color_reset}}",
      shortName: "{{yellow}}Bed{{color_reset}}",
      aliases: ["bed", "sleep", "rest"],
      takeable: false,
      description: "Your comfortable bed where you sleep each night.",
      look: (state, engine) => {
        engine.printLine("{{blue}}A cozy bed with soft pillows. It looks inviting after a long day at school.{{color_reset}}");
      },
      use: (state, engine) => {
        engine.printLine("{{cyan}}You lie down in your bed and close your eyes, ready to sleep...{{color_reset}}");

        // Advance to next day
        flags.day++;

        // Morning message
        setTimeout(() => {
          engine.printLine("{{yellow}}* * *{{color_reset}}");
          engine.printLine("{{cyan}}The morning sun wakes you up. A new day begins.{{color_reset}}");
          engine.printLine(`{{bold}}{{cyan}}--- Day ${flags.day} ---{{font_reset}}{{color_reset}}`);

          // Day-specific events
          if (flags.day === 3) {
            engine.printLine("{{yellow}}A notice on your desk: The school festival committee is looking for volunteers!{{color_reset}}");
          } else if (flags.day === 5) {
            engine.printLine("{{magenta}}You remember Sakura mentioned the festival preparations are starting soon.{{color_reset}}");
          } else if (flags.day === 7) {
            engine.printLine("{{blue}}Midterm exams are next week. Yuki offered to help you study if you need it.{{color_reset}}");
          } else if (flags.day === 9) {
            engine.printLine("{{green}}Hana seems particularly nervous today. Maybe she wants to tell you something?{{color_reset}}");
          } else if (flags.day === 10) {
            engine.printLine("{{bold}}{{cyan}}*** GRADUATION DAY ***{{font_reset}}");
            engine.printLine("{{cyan}}Today is the day - your graduation from Heartbeat High School!{{color_reset}}");
            // Graduation will trigger when player goes to school
          } else if (flags.day > 10) {
            engine.printLine("{{gray}}The days continue, but high school is over. Time to move forward.{{color_reset}}");
          }

          // Random morning thoughts based on affection
          if (flags.sakuraAffection > flags.yukiAffection && flags.sakuraAffection > flags.hanaAffection) {
            engine.printLine("{{magenta}}You find yourself thinking about Sakura's bright smile...{{color_reset}}");
          } else if (flags.yukiAffection > flags.sakuraAffection && flags.yukiAffection > flags.hanaAffection) {
            engine.printLine("{{blue}}You recall Yuki's intelligent conversations in the library...{{color_reset}}");
          } else if (flags.hanaAffection > flags.sakuraAffection && flags.hanaAffection > flags.yukiAffection) {
            engine.printLine("{{green}}You remember Hana's quiet beauty as she sketched in the courtyard...{{color_reset}}");
          }
        }, 1000);

        return true;
      }
    },
    // Environmental items
    {
      id: "cherry_tree",
      name: "{{pink}}Cherry Blossom Tree{{color_reset}}",
      aliases: ["tree", "cherry tree", "blossom tree"],
      takeable: false,
      description: "A magnificent cherry blossom tree with branches full of pink flowers.",
      look: (state, engine) => {
        engine.printLine("{{pink}}The cherry blossom tree stands proudly in the courtyard, its branches heavy with beautiful pink flowers.{{color_reset}}");
        engine.printLine("{{pink}}A gentle breeze causes petals to dance through the air like pink snowflakes.{{color_reset}}");
        if (!flags.admiredTree) {
          engine.printLine("{{cyan}}You feel a sense of peace watching the blossoms fall.{{color_reset}}");
          flags.admiredTree = true;
        }
      },
      use: (state, engine) => {
        engine.printLine("{{pink}}You reach up and carefully pluck a single perfect cherry blossom petal from the tree.{{color_reset}}");
        if (!state.inventory.includes("cherry_blossom_petal")) {
          state.inventory.push("cherry_blossom_petal");
          engine.printLine("{{green}}You now have a cherry blossom petal!{{color_reset}}");
        } else {
          engine.printLine("{{yellow}}You already have a cherry blossom petal.{{color_reset}}");
        }
        return true;
      }
    },
    {
      id: "school_well",
      name: "{{cyan}}Stone Well{{color_reset}}",
      aliases: ["well", "village well"],
      takeable: false,
      description: "An old stone well in the courtyard.",
      look: (state, engine) => {
        engine.printLine("{{cyan}}The well has stood here for generations. Students sometimes toss coins and make wishes.{{color_reset}}");
      },
      use: (state, engine) => {
        engine.printLine("{{cyan}}You peer down the well but see only darkness. You make a silent wish.{{color_reset}}");
        if (!flags.madeWish) {
          engine.printLine("{{yellow}}Maybe your wish will come true...{{color_reset}}");
          flags.madeWish = true;
        }
        return true;
      }
    },
    {
      id: "vending_machine",
      name: "{{red}}Vending Machine{{color_reset}}",
      shortName: "{{red}}Machine{{color_reset}}",
      aliases: ["vending", "drink machine"],
      takeable: false,
      description: "A colorful vending machine offering various drinks.",
      use: (state, engine) => {
        engine.printLine("{{red}}You buy a canned coffee. The caffeine gives you a slight energy boost.{{color_reset}}");
        return true;
      }
    },
    {
      id: "study_desk",
      name: "{{yellow}}Study Desk{{color_reset}}",
      shortName: "{{yellow}}Desk{{color_reset}}",
      aliases: ["study desk", "table"],
      takeable: false,
      description: "A wooden desk for reading and studying. There are two chairs. {{blue}}Yuki{{color_reset}} is sitting on one of them"
    },
    {
      id: "piano",
      name: "{{purple}}Grand Piano{{color_reset}}",
      shortName: "{{purple}}Piano{{color_reset}}",
      aliases: ["piano", "instrument"],
      takeable: false,
      description: "A beautiful grand piano, perfectly tuned.",
      use: (state, engine) => {
        engine.printLine("{{purple}}You play a simple melody. The notes fill the room with beautiful sound.{{color_reset}}");
        return true;
      }
    }
  ],
  characters: [
    // MAIN CHARACTERS
    {
      id: "sakura",
      name: "{{magenta}}Sakura Tanaka{{font_reset}}",
      aliases: ["sakura", "pink girl", "cheerful girl"],
      genre: "female",
      description: "A cheerful girl with pink hair accessories and endless energy.",
      talk: (state, engine) => {
        if (!flags.metSakura) {
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} Oh! I'm so sorry! I wasn't looking where I was going!{{color_reset}}");
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} I'm Sakura! You're the new transfer student, right? Welcome to Heartbeat High! ♡{{color_reset}}");
          flags.metSakura = true;
          flags.sakuraAffection += 1;
          engine.printLine("{{magenta}}[Sakura's affection increased!]{{color_reset}}");
        } else {
          // Show available topics
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} Hi there! What would you like to talk about?{{color_reset}}");
          engine.printLine("{{cyan}}Available topics: school, love, festival, future, hobbies, yuki, hana{{color_reset}}");
        }
      },
      topics: {
        school: {
          aliases: ["classes", "teachers", "homework"],
          dialog: (state, engine) => {
            engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} I love school! Especially the cultural festival! We should work on a project together! ♡{{color_reset}}");
            flags.sakuraAffection += 1;
            engine.printLine("{{magenta}}[Sakura's affection increased!]{{color_reset}}");
          }
        },
        love: {
          aliases: ["romance", "crush", "dating"],
          dialog: (state, engine) => {
            if (flags.sakuraAffection < 3) {
              engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} Love? That's... um... I should get to class!' *she blushes and looks away*{{color_reset}}");
            } else {
              engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} You know... sometimes... never mind! It's not important! ♡ *her face turns bright red*{{color_reset}}");
              flags.sakuraAffection += 2;
              engine.printLine("{{magenta}}[Sakura's affection increased!]{{color_reset}}");
            }
          }
        },
        festival: {
          aliases: ["cultural festival", "event"],
          dialog: (state, engine) => {
            engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} The festival is my favorite time of year! We could run a maid cafe together! Would you... want to?{{color_reset}}");
            if (!flags.sakuraFestivalInvite) {
              flags.sakuraAffection += 1;
              flags.sakuraFestivalInvite = true;
              engine.printLine("{{magenta}}[Sakura's affection increased!]{{color_reset}}");
            }
          }
        },
        future: {
          aliases: ["dreams", "career", "after graduation"],
          dialog: (state, engine) => {
            engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} I want to be an event planner! Bringing happiness to people through celebrations sounds perfect for me! ♡{{color_reset}}");
            flags.sakuraAffection += 1;
            engine.printLine("{{magenta}}[Sakura's affection increased!]{{color_reset}}");
          }
        },
        hobbies: {
          aliases: ["interests", "free time"],
          dialog: (state, engine) => {
            engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} I love baking and making cute accessories! Maybe I can make something for you someday! ♡{{color_reset}}");
            flags.sakuraAffection += 1;
            engine.printLine("{{magenta}}[Sakura's affection increased!]{{color_reset}}");
          }
        },
        yuki: {
          aliases: ["yuki nakamura", "librarian"],
          dialog: (state, engine) => {
            engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} Yuki-chan is so smart! Sometimes I wish I could be as focused as her, but I'm too energetic! ♡{{color_reset}}");
          }
        },
        hana: {
          aliases: ["hana kobayashi", "artist"],
          dialog: (state, engine) => {
            engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} Hana-chan's drawings are amazing! She's so talented, but so shy. We should all hang out together sometime! ♡{{color_reset}}");
          }
        }
      },
      onSay: (text, state, engine) => {
        const lowerText = text.toLowerCase();

        if (lowerText.includes("beautiful") || lowerText.includes("pretty") || lowerText.includes("cute")) {
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} Eh? M-me? ♡' *her face turns bright red* 'You shouldn't say things like that so suddenly!{{color_reset}}");
          flags.sakuraAffection += 1;
          engine.printLine("{{magenta}}[Sakura's affection increased!]{{color_reset}}");
        } else if (lowerText.includes("love") && lowerText.includes("you")) {
          if (flags.sakuraAffection > 5) {
            engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} I... I feel the same way! ♡ I've liked you since the day we met! *she hugs you tightly*{{color_reset}}");
            flags.sakuraAffection += 3;
            engine.printLine("{{magenta}}[Sakura's affection increased!]{{color_reset}}");
          } else {
            engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} Whaaa?! That's so sudden! I need to... um... check something! *she runs away flustered*{{color_reset}}");
          }
        } else if (lowerText.includes("stupid") || lowerText.includes("annoying") || lowerText.includes("dumb")) {
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} That's mean! I was just trying to be nice... *her eyes tear up*{{color_reset}}");
          flags.sakuraAffection -= 2;
          engine.printLine("{{magenta}}[Sakura's affection decreased!]{{color_reset}}");
        } else if (lowerText.includes("baking") || lowerText.includes("cookies") || lowerText.includes("sweets")) {
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} You like baked goods too? I'll bring some for you tomorrow! ♡{{color_reset}}");
          flags.sakuraAffection += 1;
          engine.printLine("{{magenta}}[Sakura's affection increased!]{{color_reset}}");
        }
      }
    },
    {
      id: "yuki",
      name: "{{blue}}Yuki Nakamura{{font_reset}}",
      aliases: ["yuki", "smart girl"],
      genre: "female",
      description: "The serious library committee member with sharp glasses and intelligent eyes.",
      talk: (state, engine) => {
        if (!flags.metYuki) {
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} Can I help you find something? The library has strict rules about noise and returned books.{{color_reset}}");
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} I'm Yuki Nakamura, library committee. Please follow the rules.{{color_reset}}");
          flags.metYuki = true;
        } else {
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} What topic interests you today?{{color_reset}}");
          engine.printLine("{{cyan}}Available topics: books, future, feelings, study, university, sakura, hana{{color_reset}}");
        }
      },
      topics: {
        books: {
          aliases: ["literature", "reading", "study", "library"],
          dialog: (state, engine) => {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} Knowledge is power. Though... some romance novels can be... interesting. *she adjusts her glasses*{{color_reset}}");
            flags.yukiAffection += 1;
            engine.printLine("{{blue}}[Yuki's affection increased!]{{color_reset}}");
          }
        },
        future: {
          aliases: ["dreams", "career", "college"],
          dialog: (state, engine) => {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} I plan to attend Tokyo University. But recently... I've been considering other possibilities.{{color_reset}}");
            if (flags.yukiAffection > 2) {
              engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} Perhaps having someone to share the journey with would be... nice. ♡{{color_reset}}");
              flags.yukiAffection += 2;
              engine.printLine("{{blue}}[Yuki's affection increased!]{{color_reset}}");
            }
          }
        },
        feelings: {
          aliases: ["emotions", "heart"],
          condition: state => flags.yukiAffection > 4,
          blockedMessage: "{{blue}}{{bold}}Yuki:{{font_reset}} That's... not something I discuss casually.{{color_reset}}",
          dialog: (state, engine) => {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} I used to believe emotions were illogical. But meeting you... has challenged that belief. ♡{{color_reset}}");
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} Would you consider... visiting the university with me this weekend?{{color_reset}}");
            flags.yukiConfession = true;
          }
        },
        study: {
          aliases: ["homework", "exams", "grades"],
          dialog: (state, engine) => {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} Consistent study habits are crucial for academic success. I can help you develop a schedule if you'd like.{{color_reset}}");
            flags.yukiAffection += 1;
            engine.printLine("{{blue}}[Yuki's affection increased!]{{color_reset}}");
          }
        },
        university: {
          aliases: ["tokyo university", "higher education"],
          dialog: (state, engine) => {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} Tokyo University has the best literature program in the country. Though... location is becoming a factor in my decision.{{color_reset}}");
            flags.yukiAffection += 1;
            engine.printLine("{{blue}}[Yuki's affection increased!]{{color_reset}}");
          }
        },
        sakura: {
          aliases: ["sakura tanaka", "cheerful"],
          dialog: (state, engine) => {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} Sakura's energy is... impressive. While our approaches differ, her optimism can be refreshing on difficult days.{{color_reset}}");
          }
        },
        hana: {
          aliases: ["hana kobayashi", "artist"],
          dialog: (state, engine) => {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} Hana has a unique perspective on the world. Her art captures moments in ways words cannot. It's... admirable.{{color_reset}}");
          }
        }
      },
      onSay: (text, state, engine) => {
        const lowerText = text.toLowerCase();

        if (lowerText.includes("smart") || lowerText.includes("intelligent") || lowerText.includes("wise")) {
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} Intelligence is merely applied effort. But... thank you for noticing. *she adjusts her glasses, hiding a slight smile*{{color_reset}}");
          flags.yukiAffection += 1;
          engine.printLine("{{blue}}[Yuki's affection increased!]{{color_reset}}");
        } else if (lowerText.includes("love") && lowerText.includes("you")) {
          if (flags.yukiAffection > 6) {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} Logically speaking, our compatibility is 98.7%. Emotionally... I feel the same. ♡{{color_reset}}");
            flags.yukiAffection += 3;
            engine.printLine("{{blue}}[Yuki's affection increased!]{{color_reset}}");
          } else {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} That statement lacks sufficient data to process. Please provide evidence of your claim. *her ears turn red*{{color_reset}}");
          }
        } else if (lowerText.includes("study") || lowerText.includes("homework") || lowerText.includes("exam")) {
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} If you need assistance with your studies, I'm available during library hours.{{color_reset}}");
        } else if (lowerText.includes("cold") || lowerText.includes("robot") || lowerText.includes("heartless")) {
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} I prefer to think of myself as... focused. Your assessment is noted. *she turns away coldly*{{color_reset}}");
          flags.yukiAffection -= 2;
          engine.printLine("{{blue}}[Yuki's affection decreased!]{{color_reset}}");
        } else if (lowerText.includes("literature") || lowerText.includes("poetry") || lowerText.includes("classics")) {
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} You're interested in literature? We have an excellent collection of classical works in section C.{{color_reset}}");
          flags.yukiAffection += 1;
          engine.printLine("{{blue}}[Yuki's affection increased!]{{color_reset}}");
        }
      }
    },
    {
      id: "hana",
      name: "{{green}}Hana Kobayashi{{font_reset}}",
      aliases: ["hana", "quiet girl", "artist"],
      genre: "female",
      description: "A quiet, artistic girl who often sketches in the courtyard.",
      talk: (state, engine) => {
        if (!flags.metHana) {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} Oh! I didn't see you there... *she quickly closes her sketchbook*{{color_reset}}");
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} I'm Hana. I like to draw here... when it's quiet.{{color_reset}}");
          flags.metHana = true;
        } else {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} Is there something you'd like to know about?{{color_reset}}");
          engine.printLine("{{cyan}}Available topics: art, nature, courage, dreams, seasons, sakura, yuki{{color_reset}}");
        }
      },
      topics: {
        art: {
          aliases: ["drawing", "painting", "sketching"],
          dialog: (state, engine) => {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} I love capturing beautiful moments... like the way light filters through leaves.{{color_reset}}");
            if (flags.hanaAffection > 1) {
              engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} Maybe... I could draw you sometime? ♡{{color_reset}}");
            }
            flags.hanaAffection += 1;
            engine.printLine("{{green}}[Hana's affection increased!]{{color_reset}}");
          }
        },
        nature: {
          aliases: ["flowers", "trees", "seasons"],
          dialog: (state, engine) => {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} Everything in nature has its own beauty and story. Like how each cherry blossom is unique.{{color_reset}}");
            flags.hanaAffection += 1;
            engine.printLine("{{green}}[Hana's affection increased!]{{color_reset}}");
          }
        },
        courage: {
          aliases: ["bravery", "confidence"],
          condition: state => flags.hanaAffection > 3,
          blockedMessage: "{{green}}{{bold}}Hana:{{font_reset}} Some things are... difficult to talk about.{{color_reset}}",
          dialog: (state, engine) => {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} I've always been shy... but being with you makes me feel brave.{{color_reset}}");
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} There's something I want to tell you... in my sketchbook. ♡{{color_reset}}");
            flags.hanaConfession = true;
          }
        },
        dreams: {
          aliases: ["aspirations", "goals"],
          dialog: (state, engine) => {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} I want to study art at university... and maybe have my own gallery someday. It sounds impossible, but...{{color_reset}}");
            flags.hanaAffection += 1;
            engine.printLine("{{green}}[Hana's affection increased!]{{color_reset}}");
          }
        },
        seasons: {
          aliases: ["spring", "autumn", "winter", "summer"],
          dialog: (state, engine) => {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} Each season has its own palette. Spring pinks, summer greens, autumn golds... I try to capture them all.{{color_reset}}");
            flags.hanaAffection += 1;
            engine.printLine("{{green}}[Hana's affection increased!]{{color_reset}}");
          }
        },
        sakura: {
          aliases: ["sakura tanaka", "energetic"],
          dialog: (state, engine) => {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} Sakura-chan is like sunshine. She always tries to include me in activities... I'm grateful for her kindness.{{color_reset}}");
          }
        },
        yuki: {
          aliases: ["yuki nakamura", "librarian"],
          dialog: (state, engine) => {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} Yuki-san is amazing. She remembers every book in the library... I wish I had that kind of focus.{{color_reset}}");
          }
        }
      },
      onSay: (text, state, engine) => {
        const lowerText = text.toLowerCase();

        if (lowerText.includes("beautiful") || lowerText.includes("art") || lowerText.includes("drawing")) {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} You think so? ♡ I... I'm glad you like it. *she shyly looks at her sketchbook*{{color_reset}}");
          flags.hanaAffection += 1;
          engine.printLine("{{green}}[Hana's affection increased!]{{color_reset}}");
        } else if (lowerText.includes("love") && lowerText.includes("you")) {
          if (flags.hanaAffection > 4) {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} I... I've been waiting to hear that. ♡ My heart has been yours for so long... *she shows you a sketchbook filled with drawings of you*{{color_reset}}");
            flags.hanaAffection += 3;
            engine.printLine("{{green}}[Hana's affection increased!]{{color_reset}}");
          } else {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} That's... I need to go!' *she quickly gathers her things, her face bright red*{{color_reset}}");
          }
        } else if (lowerText.includes("cherry") || lowerText.includes("flower") || lowerText.includes("tree")) {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} Nature speaks in colors and shapes... it's the most honest form of beauty.{{color_reset}}");
        } else if (lowerText.includes("quiet") || lowerText.includes("shy") || lowerText.includes("boring")) {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} I... I see. Sorry for bothering you. *she looks down, hurt*{{color_reset}}");
          flags.hanaAffection -= 2;
          engine.printLine("{{green}}[Hana's affection decreased!]{{color_reset}}");
        } else if (lowerText.includes("brave") || lowerText.includes("confident") || lowerText.includes("strong")) {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} You really think I can be... like that? Thank you for believing in me.{{color_reset}}");
          flags.hanaAffection += 1;
          engine.printLine("{{green}}[Hana's affection increased!]{{color_reset}}");
        } else if (lowerText.includes("sketch") || lowerText.includes("paint") || lowerText.includes("canvas")) {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} You understand art? It's... nice to find someone who appreciates it too.{{color_reset}}");
          flags.hanaAffection += 1;
          engine.printLine("{{green}}[Hana's affection increased!]{{color_reset}}");
        }
      }
    },
    // BACKGROUND CHARACTERS
    {
      id: "mother",
      name: "{{yellow}}Mother{{font_reset}}",
      aliases: ["mom", "mother"],
      genre: "female",
      description: "Your caring mother who always makes sure you eat breakfast.",
      talk: (state, engine) => {
        engine.printLine("{{yellow}}{{bold}}Mother:{{font_reset}} Make sure you eat properly and don't stay up too late studying!{{color_reset}}");
        if (flags.day >= 5) {
          engine.printLine("{{yellow}}{{bold}}Mother:{{font_reset}} You seem to be making friends at school. That's good to see.{{color_reset}}");
        }
      }
    },
    {
      id: "school_guard",
      name: "{{gray}}School Guard{{font_reset}}",
      aliases: ["guard", "security"],
      genre: "male",
      description: "The school security guard who watches the gates.",
      talk: (state, engine) => {
        engine.printLine("{{gray}}{{bold}}Guard:{{font_reset}} Move along, student. Don't be late for class.{{color_reset}}");
      }
    },
    {
      id: "student_council_president",
      name: "{{red}}Student Council President{{font_reset}}",
      aliases: ["president", "council president"],
      genre: "male",
      description: "The serious student council president.",
      talk: (state, engine) => {
        engine.printLine("{{red}}{{bold}}President:{{font_reset}} The school festival preparations are underway. Make sure to participate in club activities.{{color_reset}}");
      }
    },
    {
      id: "class_rep",
      name: "{{blue}}Class Representative{{font_reset}}",
      aliases: ["class rep", "representative"],
      genre: "female",
      description: "Your diligent class representative.",
      talk: (state, engine) => {
        engine.printLine("{{blue}}{{bold}}Class Rep:{{font_reset}} Don't forget to submit your homework by Friday. And clean your desk before leaving.{{color_reset}}");
      }
    },
    {
      id: "librarian",
      name: "{{magenta}}Head Librarian{{font_reset}}",
      aliases: ["librarian", "head librarian", "old librarian"],
      genre: "female",
      description: "The elderly head librarian.",
      talk: (state, engine) => {
        engine.printLine("{{magenta}}{{bold}}Librarian:{{font_reset}} Shhh! This is a library, not a playground. Respect the silence.{{color_reset}}");
      }
    },
    {
      id: "lunch_lady",
      name: "{{orange}}Lunch Lady{{font_reset}}",
      aliases: ["cafeteria lady", "lunch staff"],
      genre: "female",
      description: "The cheerful lunch lady who serves food.",
      talk: (state, engine) => {
        engine.printLine("{{orange}}{{bold}}Lunch Lady:{{font_reset}} Today's special is curry rice! It's very popular, so hurry before it runs out!{{color_reset}}");
      }
    },
    {
      id: "sports_captain",
      name: "{{red}}Sports Team Captain{{font_reset}}",
      aliases: ["captain", "sports captain"],
      genre: "male",
      description: "The athletic sports team captain.",
      talk: (state, engine) => {
        engine.printLine("{{red}}{{bold}}Sports Captain:{{font_reset}} Join the sports teams! We need more dedicated members for the upcoming tournament!{{color_reset}}");
      }
    },
    {
      id: "music_president",
      name: "{{purple}}Music Club President{{font_reset}}",
      aliases: ["music president", "band leader"],
      genre: "female",
      description: "The passionate music club president.",
      talk: (state, engine) => {
        engine.printLine("{{purple}}{{bold}}Music President:{{font_reset}} The sound of music fills the soul. Have you considered joining the music club?{{color_reset}}");
      }
    },
    // Random students
    {
      id: "random_student1",
      name: "{{gray}}Student{{font_reset}}",
      aliases: ["student", "boy"],
      genre: "male",
      description: "A random student going about their day.",
      talk: (state, engine) => {
        engine.printLine("{{gray}}{{bold}}Student:{{font_reset}} I have a math test next period... I should have studied more.{{color_reset}}");
      }
    },
    {
      id: "random_student2",
      name: "{{gray}}Student{{font_reset}}",
      aliases: ["student", "girl"],
      genre: "female",
      description: "A random student chatting with friends.",
      talk: (state, engine) => {
        engine.printLine("{{gray}}{{bold}}Student:{{font_reset}} Did you see the new transfer student? They seem interesting.{{color_reset}}");
      }
    },
    {
      id: "random_student3",
      name: "{{gray}}Student{{font_reset}}",
      aliases: ["student", "boy"],
      genre: "male",
      description: "A student eating lunch.",
      talk: (state, engine) => {
        engine.printLine("{{gray}}{{bold}}Student:{{font_reset}} The cafeteria food is actually pretty good today.{{color_reset}}");
      }
    },
    {
      id: "art_club_member",
      name: "{{green}}Art Club Member{{font_reset}}",
      aliases: ["art member", "club member"],
      genre: "female",
      description: "A member of the art club.",
      talk: (state, engine) => {
        engine.printLine("{{green}}{{bold}}Art Member:{{font_reset}} The light in the courtyard is perfect for painting today.{{color_reset}}");
      }
    },
    {
      id: "track_member",
      name: "{{red}}Track Team Member{{font_reset}}",
      aliases: ["track", "runner"],
      genre: "male",
      description: "A member of the track team.",
      talk: (state, engine) => {
        engine.printLine("{{red}}{{bold}}Track Member:{{font_reset}} I need to shave two seconds off my time before the meet.{{color_reset}}");
      }
    },
    {
      id: "rooftop_couple",
      name: "{{pink}}Couple{{font_reset}}",
      aliases: ["couple", "lovebirds"],
      genre: "both",
      description: "A couple enjoying the rooftop view.",
      talk: (state, engine) => {
        engine.printLine("{{pink}}{{bold}}Couple:{{font_reset}} Sorry, could you give us some privacy? *they blush and look away*{{color_reset}}");
      }
    }
  ],
  events: [
    {
      id: "graduation",
      condition: state => flags.day >= 10,
      trigger: (state, engine) => {
        triggerGraduation(state, engine);
      }
    }
  ]
};

function triggerGraduation(state, engine) {
  engine.printLine("{{bold}}{{cyan}}*** GRADUATION DAY ***{{font_reset}}");
  engine.printLine("{{cyan}}Three years have passed at Heartbeat High School. The cherry blossoms bloom once more as you stand at the school gates for the last time.{{color_reset}}");

  // Small delay for dramatic effect
  setTimeout(() => {
    // Determine ending based on affection levels
    const maxAffection = Math.max(flags.sakuraAffection, flags.yukiAffection, flags.hanaAffection);

    engine.printLine("{{cyan}}Final Affection Levels:{{color_reset}}");
    engine.printLine(`{{magenta}}Sakura: ${flags.sakuraAffection}{{color_reset}}`);
    engine.printLine(`{{blue}}Yuki: ${flags.yukiAffection}{{color_reset}}`);
    engine.printLine(`{{green}}Hana: ${flags.hanaAffection}{{color_reset}}`);

    setTimeout(() => {
      if (maxAffection < 5) {
        engine.printLine("{{gray}}You graduate alone, watching your classmates pair off. Some opportunities, once missed, are gone forever.{{color_reset}}");
        engine.printLine("{{bold}}ENDING: Solitary Future{{font_reset}}");
      } else if (flags.sakuraAffection === maxAffection) {
        engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} I waited for this day! Let's always be together, okay? ♡{{color_reset}}");
        engine.printLine("{{magenta}}She takes your hand, and you walk forward into your future together, planning the most amazing events and celebrations.{{color_reset}}");
        engine.printLine("{{bold}}ENDING: Eternal Sunshine with Sakura{{font_reset}}");
      } else if (flags.yukiAffection === maxAffection) {
        engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} We both got into Tokyo University. It seems our futures are... intertwined. ♡{{color_reset}}");
        engine.printLine("{{blue}}She smiles, a rare and precious sight, as you plan your academic life together in Tokyo.{{color_reset}}");
        engine.printLine("{{bold}}ENDING: Intellectual Harmony with Yuki{{font_reset}}");
      } else if (flags.hanaAffection === maxAffection) {
        engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} You inspired me to be brave enough to apply to art school. Thank you. ♡{{color_reset}}");
        engine.printLine("{{green}}You hold hands under the cherry blossoms, beginning a beautiful new chapter filled with art and creativity.{{color_reset}}");
        engine.printLine("{{bold}}ENDING: Artistic Soulmates with Hana{{font_reset}}");
      }

      setTimeout(() => {
        engine.printLine("{{bold}}{{cyan}}Thank you for playing Heartbeat High School!{{font_reset}}");
        engine.printLine("{{cyan}}Type 'restart' to play again, 'quit' to exit or keep playing.{{color_reset}}");
      }, 1000);
    }, 1500);
  }, 1000);
}
