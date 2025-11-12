/**
 * HEARTBEAT HIGH SCHOOL - Otaku Romance Visual Novel for LoreJS
 * 
 * AUTHOR: RetoraDev
 * VERSION: 1.0
 * GENRE: School Romance / Visual Novel
 * 
 * STORY SYNOPSIS:
 * You're a transfer student at Heartbeat High School, where cherry blossoms bloom
 * and young hearts flutter. Three unique girls await your attention, each with
 * their own dreams and personalities. Will you find love before graduation day?
 * 
 * MAIN CHARACTERS:
 * - Sakura Tanaka (Magenta): Cheerful, energetic, loves school festivals
 * - Yuki Nakamura (Blue): Intelligent librarian, logical but secretly romantic  
 * - Hana Kobayashi (Green): Artistic, shy, finds beauty in nature
 * 
 * HOW TO PLAY & COMPLETE THE GAME:
 * 
 * STEP 1: MEET ALL THREE GIRLS
 *   - Go to hallway to meet Sakura and Yuki
 *   - Visit courtyard to meet Hana
 *   - Use 'talk' command to introduce yourself
 * 
 * STEP 2: BUILD AFFECTION WITH YOUR FAVORITE GIRL
 *   - Use 'talk <name> about <topic>' to learn about them
 *   - Try different topics: love, school, future, art, etc.
 *   - Use 'say' command to compliment them or express feelings
 *   - Give gifts when appropriate (use items near characters)
 * 
 * STEP 3: EXPLORE KEY LOCATIONS
 *   - Classroom: Find love letter and textbooks
 *   - Hallway: Meet multiple characters
 *   - Courtyard: Find cherry blossoms and Hana
 *   - Library: Find romance novels and Yuki
 *   - Rooftop: Quiet area for reflection
 * 
 * STEP 4: SPECIAL INTERACTIONS
 *   - Use 'talk her' when only one girl is present
 *   - Try 'say I love you' when affection is high enough
 *   - Use items near characters for bonus affection
 *   - Listen to character reactions with 'say' command
 * 
 * STEP 5: REACH GRADUATION (Day 10)
 *   - The game progresses through days automatically
 *   - After 10 days, graduation event triggers automatically
 *   - Ending is determined by highest affection level
 * 
 * POSSIBLE ENDINGS:
 * 1. Eternal Sunshine with Sakura (Highest Sakura affection)
 * 2. Intellectual Harmony with Yuki (Highest Yuki affection) 
 * 3. Artistic Soulmates with Hana (Highest Hana affection)
 * 4. Solitary Future (Low affection with all girls)
 * 
 * TIPS FOR SUCCESS:
 * - Pay attention to each girl's personality when talking
 * - Sakura responds to enthusiasm and festival talk
 * - Yuki appreciates intellectual compliments and study talk
 * - Hana loves nature comments and artistic encouragement
 * - Use 'help' command to see all available commands
 * - Save your game regularly with 'save' command
 * 
 * AFFECTION SYSTEM:
 * - Starts at 0 for each character
 * - Increases through positive interactions
 * - Decreases through insults or negative comments
 * - Need 5+ affection for romantic ending
 * - Higher affection unlocks special dialogue options
 * 
 * COMMAND REFERENCE:
 *   look/go/take/use/talk/say/inventory/save/load/help/quit
 *   talk sakura about love
 *   talk her (when only one girl present)
 *   say you are beautiful
 *   use cherry_blossom (when Hana is present)
 */

module.exports = {
  title: "{{magenta}}Heartbeat High School{{font_reset}}",
  startRoom: "classroom",
  rooms: [
    {
      id: "classroom",
      name: "{{bold}}{{blue}}Class 2-B Classroom{{font_reset}}",
      description: "A typical Japanese classroom with rows of wooden desks. Sunlight streams through the large windows. The {{cyan}}blackboard{{color_reset}} at the front still has yesterday's math equations. You can go to the {{yellow}}hallway{{color_reset}} or visit the {{yellow}}rooftop{{color_reset}}.",
      exits: {
        hallway: "hallway",
        rooftop: "rooftop"
      },
      items: ["math_textbook", "love_letter"],
      onEnter: (state, engine) => {
        if (!state.flags.firstDay) {
          engine.printLine("{{cyan}}It's your first day at Heartbeat High School. The cherry blossoms outside are in full bloom.{{color_reset}}");
          state.flags.firstDay = true;
          state.flags.day = 1;
          state.flags.sakuraAffection = 0;
          state.flags.yukiAffection = 0;
          state.flags.hanaAffection = 0;
        }
      }
    },
    {
      id: "hallway",
      name: "{{bold}}{{yellow}}School Hallway{{font_reset}}",
      description: "A long, polished hallway lined with cherrywood lockers. Students mill about between classes. You can see the {{yellow}}classroom{{color_reset}}, {{yellow}}courtyard{{color_reset}}, and the {{yellow}}library{{color_reset}}.",
      exits: {
        classroom: "classroom",
        courtyard: "courtyard",
        library: "library"
      },
      characters: ["sakura", "yuki"],
      onEnter: (state, engine) => {
        if (state.flags.day === 1 && !state.flags.metSakura) {
          engine.printLine("{{magenta}}A girl with pink hair accessories bumps into you accidentally.{{color_reset}}");
        }
      }
    },
    {
      id: "courtyard",
      name: "{{bold}}{{green}}School Courtyard{{font_reset}}",
      description: "A beautiful courtyard with cherry blossom trees. A gentle breeze carries pink petals through the air. Benches are scattered around for students to relax. You can return to the {{yellow}}hallway{{color_reset}}.",
      exits: {
        hallway: "hallway"
      },
      characters: ["hana"],
      items: ["cherry_blossom"],
      onEnter: (state, engine) => {
        if (state.flags.day === 1 && !state.flags.metHana) {
          engine.printLine("{{green}}You notice a girl quietly reading under the largest cherry tree.{{color_reset}}");
        }
      }
    },
    {
      id: "library",
      name: "{{bold}}{{magenta}}School Library{{font_reset}}",
      description: "A quiet library filled with tall bookshelves. The smell of old paper fills the air. Some students study at wooden tables. You can go back to the {{yellow}}hallway{{color_reset}}.",
      exits: {
        hallway: "hallway"
      },
      characters: ["yuki"],
      items: ["romance_novel"],
      onEnter: (state, engine) => {
        if (state.flags.day === 1 && !state.flags.metYuki) {
          engine.printLine("{{blue}}A serious-looking girl with glasses is organizing books at the counter.{{color_reset}}");
        }
      }
    },
    {
      id: "rooftop",
      name: "{{bold}}{{cyan}}School Rooftop{{font_reset}}",
      description: "The school rooftop offers a stunning view of the city. It's usually quiet up here, a perfect escape from the crowded hallways. You can go back to the {{yellow}}classroom{{color_reset}}.",
      exits: {
        classroom: "classroom"
      },
      onEnter: (state, engine) => {
        if (!state.flags.visitedRooftop) {
          engine.printLine("{{cyan}}The wind feels refreshing up here. You can see the entire school grounds.{{color_reset}}");
          state.flags.visitedRooftop = true;
        }
      }
    }
  ],
  items: [
    {
      id: "math_textbook",
      name: "{{blue}}Math Textbook{{color_reset}}",
      aliases: ["textbook", "math book", "calculus book"],
      takeable: true,
      description: "Your mathematics textbook. It's surprisingly heavy.",
      use: (state, engine) => {
        engine.printLine("You flip through the math textbook. The equations make your head spin.");
        if (state.flags.yukiAffection > 0) {
          engine.printLine("{{blue}}You remember Yuki offering to help you study...{{color_reset}}");
        }
        return true;
      }
    },
    {
      id: "love_letter",
      name: "{{magenta}}Mysterious Love Letter{{color_reset}}",
      aliases: ["letter", "note", "confession letter"],
      takeable: true,
      description: "An anonymous love letter you found in your desk. Who could it be from?",
      use: (state, engine) => {
        engine.printLine("{{magenta}}The letter reads: 'My heart beats faster every time I see you. Meet me after school in the courtyard. {{red}}♡{{magenta}}'{{color_reset}}");
        if (!state.flags.readLoveLetter) {
          engine.printLine("{{cyan}}Your face feels warm. Someone has a crush on you!{{color_reset}}");
          state.flags.readLoveLetter = true;
        }
        return true;
      }
    },
    {
      id: "cherry_blossom",
      name: "{{pink}}Perfect Cherry Blossom{{color_reset}}",
      aliases: ["blossom", "cherry petal", "flower"],
      takeable: true,
      description: "A perfectly preserved cherry blossom petal.",
      use: (state, engine) => {
        const room = engine.world.rooms.get(state.currentRoom);
        if (room.characters && room.characters.includes("hana")) {
          engine.printLine("{{pink}}You offer the cherry blossom to Hana. She smiles warmly.{{color_reset}}");
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'It's beautiful... thank you. {{red}}♡{{green}}'{{color_reset}}");
          if (!state.flags.gaveFlowerToHana) {
            state.flags.hanaAffection += 2;
            state.flags.gaveFlowerToHana = true;
          }
        } else {
          engine.printLine("The cherry blossom is beautiful, but there's no one to share it with right now.");
        }
        return true;
      }
    },
    {
      id: "romance_novel",
      name: "{{red}}Romance Novel{{color_reset}}",
      aliases: ["novel", "book", "love story"],
      takeable: true,
      description: "A shoujo romance novel with a dramatic cover.",
      use: (state, engine) => {
        const room = engine.world.rooms.get(state.currentRoom);
        if (room.characters && room.characters.includes("yuki")) {
          engine.printLine("{{blue}}You show the romance novel to Yuki. She adjusts her glasses.{{color_reset}}");
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'That's... not the kind of literature I usually read.' But you notice her blushing.{{color_reset}}");
          if (!state.flags.showedNovelToYuki) {
            state.flags.yukiAffection += 1;
            state.flags.showedNovelToYuki = true;
          }
        } else {
          engine.printLine("You read a few pages. The story is surprisingly engaging.");
        }
        return true;
      }
    }
  ],
  characters: [
    {
      id: "sakura",
      name: "{{magenta}}Sakura Tanaka{{font_reset}}",
      aliases: ["sakura", "pink girl", "cheerful girl"],
      genre: "female",
      description: "A cheerful girl with pink hair accessories and endless energy.",
      talk: (state, engine) => {
        if (!state.flags.metSakura) {
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'Oh! I'm so sorry! I wasn't looking where I was going!'{{color_reset}}");
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'I'm Sakura! You're the new transfer student, right? Welcome to Heartbeat High! {{red}}♡{{magenta}}'{{color_reset}}");
          state.flags.metSakura = true;
          state.flags.sakuraAffection += 1;
        } else {
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'Hi there! The school festival is coming up soon - it's going to be so much fun!'{{color_reset}}");
        }
      },
      topics: {
        school: {
          aliases: ["classes", "teachers", "homework"],
          dialog: (state, engine) => {
            engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'I love school! Especially the cultural festival! We should work on a project together! {{red}}♡{{magenta}}'{{color_reset}}");
            state.flags.sakuraAffection += 1;
          }
        },
        love: {
          aliases: ["romance", "crush", "dating"],
          dialog: (state, engine) => {
            if (state.flags.sakuraAffection < 3) {
              engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'Love? That's... um... I should get to class!' *she blushes and looks away*{{color_reset}}");
            } else {
              engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'You know... sometimes... never mind! It's not important! {{red}}♡{{magenta}}' *her face turns bright red*{{color_reset}}");
              state.flags.sakuraAffection += 2;
            }
          }
        },
        festival: {
          aliases: ["cultural festival", "event"],
          dialog: (state, engine) => {
            engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'The festival is my favorite time of year! We could run a maid cafe together! Would you... want to?{{color_reset}}");
            if (!state.flags.sakuraFestivalInvite) {
              state.flags.sakuraAffection += 1;
              state.flags.sakuraFestivalInvite = true;
            }
          }
        }
      },
      onSay: (text, state, engine) => {
        const lowerText = text.toLowerCase();
        
        // Compliments
        if (lowerText.includes("beautiful") || lowerText.includes("pretty") || lowerText.includes("cute")) {
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'Eh? M-me? {{red}}♡{{magenta}}' *her face turns bright red* 'You shouldn't say things like that so suddenly!'{{color_reset}}");
          state.flags.sakuraAffection += 1;
        }
        // Love declarations
        else if (lowerText.includes("love") && lowerText.includes("you")) {
          if (state.flags.sakuraAffection > 5) {
            engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'I... I feel the same way! {{red}}♡{{magenta}} I've liked you since the day we met!' *she hugs you tightly*{{color_reset}}");
            state.flags.sakuraAffection += 3;
          } else {
            engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'Whaaa?! That's so sudden! I need to... um... check something!' *she runs away flustered*{{color_reset}}");
          }
        }
        // Insults (negative reaction)
        else if (lowerText.includes("stupid") || lowerText.includes("annoying") || lowerText.includes("dumb")) {
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'That's mean! I was just trying to be nice...' *her eyes tear up*{{color_reset}}");
          state.flags.sakuraAffection -= 2;
        }
        // Greetings
        else if (lowerText.includes("hello") || lowerText.includes("hi") || lowerText.includes("hey")) {
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'Hi there! {{red}}♡{{magenta}} It's great to see you!'{{color_reset}}");
        }
        // Festival mention
        else if (lowerText.includes("festival")) {
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'You're thinking about the festival too? We should definitely do something together!'{{color_reset}}");
        }
      }
    },
    {
      id: "yuki",
      name: "{{blue}}Yuki Nakamura{{font_reset}}",
      aliases: ["yuki", "librarian", "smart girl"],
      genre: "female",
      description: "The serious library committee member with sharp glasses and intelligent eyes.",
      talk: (state, engine) => {
        if (!state.flags.metYuki) {
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'Can I help you find something? The library has strict rules about noise and returned books.'{{color_reset}}");
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'I'm Yuki Nakamura, library committee. Please follow the rules.'{{color_reset}}");
          state.flags.metYuki = true;
        } else {
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'The organized mind is the most powerful tool. Are you here to study?'{{color_reset}}");
        }
      },
      topics: {
        books: {
          aliases: ["literature", "reading", "study"],
          dialog: (state, engine) => {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'Knowledge is power. Though... some romance novels can be... interesting.' *she adjusts her glasses*{{color_reset}}");
            state.flags.yukiAffection += 1;
          }
        },
        future: {
          aliases: ["dreams", "career", "college"],
          dialog: (state, engine) => {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'I plan to attend Tokyo University. But recently... I've been considering other possibilities.'{{color_reset}}");
            if (state.flags.yukiAffection > 2) {
              engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'Perhaps having someone to share the journey with would be... nice. {{red}}♡{{blue}}'{{color_reset}}");
              state.flags.yukiAffection += 2;
            }
          }
        },
        feelings: {
          aliases: ["emotions", "heart"],
          condition: (state) => state.flags.yukiAffection > 4,
          blockedMessage: "{{blue}}{{bold}}Yuki:{{font_reset}} 'That's... not something I discuss casually.'{{color_reset}}",
          dialog: (state, engine) => {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'I used to believe emotions were illogical. But meeting you... has challenged that belief. {{red}}♡{{blue}}'{{color_reset}}");
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'Would you consider... visiting the university with me this weekend?'{{color_reset}}");
            state.flags.yukiConfession = true;
          }
        }
      },
      onSay: (text, state, engine) => {
        const lowerText = text.toLowerCase();
        
        // Intellectual compliments
        if (lowerText.includes("smart") || lowerText.includes("intelligent") || lowerText.includes("wise")) {
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'Intelligence is merely applied effort. But... thank you for noticing.' *she adjusts her glasses, hiding a slight smile*{{color_reset}}");
          state.flags.yukiAffection += 1;
        }
        // Love declarations
        else if (lowerText.includes("love") && lowerText.includes("you")) {
          if (state.flags.yukiAffection > 6) {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'Logically speaking, our compatibility is 98.7%. Emotionally... I feel the same. {{red}}♡{{blue}}'{{color_reset}}");
            state.flags.yukiAffection += 3;
          } else {
            engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'That statement lacks sufficient data to process. Please provide evidence of your claim.' *her ears turn red*{{color_reset}}");
          }
        }
        // Study related
        else if (lowerText.includes("study") || lowerText.includes("homework") || lowerText.includes("exam")) {
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'If you need assistance with your studies, I'm available during library hours.'{{color_reset}}");
        }
        // Insults
        else if (lowerText.includes("cold") || lowerText.includes("robot") || lowerText.includes("heartless")) {
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'I prefer to think of myself as... focused. Your assessment is noted.' *she turns away coldly*{{color_reset}}");
          state.flags.yukiAffection -= 2;
        }
        // Library rules
        else if (lowerText.includes("quiet") || lowerText.includes("silence") || lowerText.includes("rules")) {
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'The library rules exist for everyone's benefit. I'm glad you understand.'{{color_reset}}");
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
        if (!state.flags.metHana) {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'Oh! I didn't see you there...' *she quickly closes her sketchbook*{{color_reset}}");
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'I'm Hana. I like to draw here... when it's quiet.'{{color_reset}}");
          state.flags.metHana = true;
        } else {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'The cherry blossoms are beautiful today... don't you think?'{{color_reset}}");
        }
      },
      topics: {
        art: {
          aliases: ["drawing", "painting", "sketching"],
          dialog: (state, engine) => {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'I love capturing beautiful moments... like the way light filters through leaves.'{{color_reset}}");
            if (state.flags.hanaAffection > 1) {
              engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'Maybe... I could draw you sometime? {{red}}♡{{green}}'{{color_reset}}");
            }
            state.flags.hanaAffection += 1;
          }
        },
        nature: {
          aliases: ["flowers", "trees", "seasons"],
          dialog: (state, engine) => {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'Everything in nature has its own beauty and story. Like how each cherry blossom is unique.'{{color_reset}}");
            state.flags.hanaAffection += 1;
          }
        },
        courage: {
          aliases: ["bravery", "confidence"],
          condition: (state) => state.flags.hanaAffection > 3,
          blockedMessage: "{{green}}{{bold}}Hana:{{font_reset}} 'Some things are... difficult to talk about.'{{color_reset}}",
          dialog: (state, engine) => {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'I've always been shy... but being with you makes me feel brave.'{{color_reset}}");
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'There's something I want to tell you... in my sketchbook. {{red}}♡{{green}}'{{color_reset}}");
            state.flags.hanaConfession = true;
          }
        }
      },
      onSay: (text, state, engine) => {
        const lowerText = text.toLowerCase();
        
        // Artistic compliments
        if (lowerText.includes("beautiful") || lowerText.includes("art") || lowerText.includes("drawing")) {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'You think so? {{red}}♡{{green}} I... I'm glad you like it.' *she shyly looks at her sketchbook*{{color_reset}}");
          state.flags.hanaAffection += 1;
        }
        // Love declarations
        else if (lowerText.includes("love") && lowerText.includes("you")) {
          if (state.flags.hanaAffection > 4) {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'I... I've been waiting to hear that. {{red}}♡{{green}} My heart has been yours for so long...' *she shows you a sketchbook filled with drawings of you*{{color_reset}}");
            state.flags.hanaAffection += 3;
          } else {
            engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'That's... I need to go!' *she quickly gathers her things, her face bright red*{{color_reset}}");
          }
        }
        // Nature comments
        else if (lowerText.includes("cherry") || lowerText.includes("flower") || lowerText.includes("tree")) {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'Nature speaks in colors and shapes... it's the most honest form of beauty.'{{color_reset}}");
        }
        // Insults
        else if (lowerText.includes("quiet") || lowerText.includes("shy") || lowerText.includes("boring")) {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'I... I see. Sorry for bothering you.' *she looks down, hurt*{{color_reset}}");
          state.flags.hanaAffection -= 2;
        }
        // Encouragement
        else if (lowerText.includes("brave") || lowerText.includes("confident") || lowerText.includes("strong")) {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'You really think I can be... like that? Thank you for believing in me.'{{color_reset}}");
          state.flags.hanaAffection += 1;
        }
      }
    }
  ],
  events: [
    {
      id: "graduation",
      condition: (state) => state.flags.day >= 10,
      trigger: (state, engine) => {
        engine.printLine("{{bold}}{{cyan}}*** GRADUATION DAY ***{{font_reset}}");
        engine.printLine("{{cyan}}Three years have passed at Heartbeat High School. The cherry blossoms bloom once more as you stand at the school gates for the last time.{{color_reset}}");
        
        // Determine ending based on affection levels
        const maxAffection = Math.max(state.flags.sakuraAffection, state.flags.yukiAffection, state.flags.hanaAffection);
        
        if (maxAffection < 5) {
          engine.printLine("{{gray}}You graduate alone, watching your classmates pair off. Some opportunities, once missed, are gone forever.{{color_reset}}");
          engine.printLine("{{bold}}ENDING: Solitary Future{{font_reset}}");
        } else if (state.flags.sakuraAffection === maxAffection) {
          engine.printLine("{{magenta}}{{bold}}Sakura:{{font_reset}} 'I waited for this day! Let's always be together, okay? {{red}}♡{{magenta}}'{{color_reset}}");
          engine.printLine("{{magenta}}She takes your hand, and you walk forward into your future together.{{color_reset}}");
          engine.printLine("{{bold}}ENDING: Eternal Sunshine with Sakura{{font_reset}}");
        } else if (state.flags.yukiAffection === maxAffection) {
          engine.printLine("{{blue}}{{bold}}Yuki:{{font_reset}} 'We both got in. It seems our futures are... intertwined.' {{red}}♡{{blue}}'{{color_reset}}");
          engine.printLine("{{blue}}She smiles, a rare and precious sight, as you plan your life together.{{color_reset}}");
          engine.printLine("{{bold}}ENDING: Intellectual Harmony with Yuki{{font_reset}}");
        } else if (state.flags.hanaAffection === maxAffection) {
          engine.printLine("{{green}}{{bold}}Hana:{{font_reset}} 'You inspired me to be brave.' {{red}}♡{{green}}'{{color_reset}}");
          engine.printLine("{{green}}You hold hands under the cherry blossoms, beginning a beautiful new chapter.{{color_reset}}");
          engine.printLine("{{bold}}ENDING: Artistic Soulmates with Hana{{font_reset}}");
        }
        
        engine.printLine("{{bold}}{{cyan}}Thank you for playing Heartbeat High School!{{font_reset}}");
      }
    }
  ]
};

// Game progression system
function advanceDay(engine) {
  engine.state.flags.day++;
  engine.printLine(`{{cyan}}--- Day ${engine.state.flags.day} ---{{color_reset}}`);
  
  // Random events based on day
  if (engine.state.flags.day === 3) {
    engine.printLine("{{yellow}}The school festival committee is looking for volunteers!{{color_reset}}");
  }
  
  if (engine.state.flags.day === 7) {
    engine.printLine("{{magenta}}Midterm exams are coming up soon. The library is getting crowded.{{color_reset}}");
  }
}