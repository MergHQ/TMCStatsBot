'use strict';

const TelegramClient = require('node-telegram-bot-api');
const needle = require('needle');
const FS = require('fs');
const courses = JSON.parse(FS.readFileSync('courses.json', 'utf8')).courses;

const getStats = courceId => {
  return `https://tmc.mooc.fi/org/hy/courses/${courceId}/points.json?api_version=7`;
};

var client = new TelegramClient('316484802:AAFI9-DgT1ZulD9W6YkI1M6Xr6_sftMr6_c', { polling: true });

client.on('message', (msg) => {
  if (msg.text.startsWith('/stats')) {
    var split = msg.text.split(' ');
    if (split.length === 3) {
      needle.get(getStats(split[1]), (err, res) => {
        if (res.statusCode === 404) {
          client.sendMessage(msg.chat.id, `*404 cannot find course ${split[1]}*`, {
            parse_mode: 'Markdown'
          });
          return;
        }
        if (String(split[2]) in res.body.awarded_for_user_and_sheet && String(split[2]) in res.body.total_for_user) {
          var course = courses.find(e => e.id === Number(split[1]));
          if (course === undefined) {
            client.sendMessage(msg.chat.id, `*404 cannot find course ${split[1]}*`, {
              parse_mode: 'Markdown'
            });
            return;
          }
          var str = `*Scores for ${split[2]} in ${course.title}:*\n`;
          var total = 0;
          var obj = res.body.awarded_for_user_and_sheet[split[2]];
          let newMap = {}
          Object.keys(obj).sort((a, b) => {
            let nA = a.replace(/^\D+/g, '');
            let nB = b.replace(/^\D+/g, '');
            if (nA > nB) return 1;
            if (nA < nB) return -1;
            return 0;
          }).forEach(e => {
            newMap[e] = obj[e]; 
          });
          obj = newMap;
          for (let o in obj) {
            str += `_${o}_ : ${obj[o]} points \n`;
            total += obj[o];
          }

          str += `*Total: ${total} points*`;
          client.sendMessage(msg.chat.id, str.trim(), {
            parse_mode: 'Markdown'
          });
        } else {
          client.sendMessage(msg.chat.id, `*Cannot find user ${split[2]}*`, {
            parse_mode: 'Markdown'
          });
        }
      });
    } else {
      client.sendMessage(msg.chat.id, '*Invalid arguments*', {
        parse_mode: 'Markdown'
      });
    }
  }
});