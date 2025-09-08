module.exports = {
  title: "Sample Novel",
  startRoom: "room1",
  rooms: [
    {
      id: "room1",
      name: "{{bold}}{{red}}The Forest{{font_reset}}",
      description: "You are in a {{green}}dense forest{{color_reset}}. The trees are {{bold}}tall{{font_reset}} and the air is {{cyan}}fresh{{color_reset}}. A path leads {{yellow}}north{{color_reset}}.",
      exits: {
        north: "room2"
      },
      items: ["torch"]
    },
    {
      id: "room2",
      name: "{{bold}}{{blue}}The Clearing{{font_reset}}",
      description: "You are in a {{green}}peaceful clearing{{color_reset}}. A small cabin stands to the {{yellow}}east{{color_reset}}.",
      exits: {
        south: "room1",
        east: "room3"
      }
    },
    {
      id: "room3",
      name: "{{bold}}{{magenta}}The Cabin{{font_reset}}",
      description: "You are inside a {{underline}}small cabin{{font_reset}}. It's {{italic}}cozy{{font_reset}} but {{red}}empty{{color_reset}}.",
      exits: {
        west: "room2"
      },
      items: ["key"]
    }
  ],
  items: [
    {
      id: "torch",
      name: "{{red}}Torch{{color_reset}}",
      takeable: true,
      use: "engine.printLine('The {{red}}torch{{color_reset}} {{yellow}}flickers brightly{{color_reset}}, illuminating the area.'); return true;"
    },
    {
      id: "key",
      name: "{{yellow}}Rusty Key{{color_reset}}",
      takeable: true,
      description: "An {{italic}}old, rusty key{{font_reset}}. It might unlock something."
    }
  ]
};
