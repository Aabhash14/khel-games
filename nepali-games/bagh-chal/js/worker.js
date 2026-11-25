// Runs the search off the main thread so the board keeps animating while the computer thinks.
importScripts('rules.js?v=3', 'ai.js?v=3');
self.onmessage = function (e) {
  var d = e.data;
  if (d.type === 'daily') { self.postMessage({ id: d.id, daily: self.BCAI.daily(d.n) }); return; }
  var s = self.BCRules.fromPlain(d.state);
  var r = self.BCAI.choose(s, { level: d.level, seen: d.seen, time: d.time });
  self.postMessage({ id: d.id, move: r.move, depth: r.depth || 0, score: r.score || 0 });
};
