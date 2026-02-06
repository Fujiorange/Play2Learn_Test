
const TrialClass = require('../models/TrialClass');
const TrialStudent = require('../models/TrialStudent');

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randBreakdown() {
  const add = randInt(0, 6);
  const sub = randInt(0, 6);
  const mul = randInt(0, 6);
  const div = randInt(0, 6);
  if (add + sub + mul + div === 0) return { add: 2, sub: 1, mul: 0, div: 0 };
  return { add, sub, mul, div };
}


function computeWeakestTopic(breakdown) {
  const b = breakdown || {};
  const entries = [
    ['add', Number(b.add || 0)],
    ['sub', Number(b.sub || 0)],
    ['mul', Number(b.mul || 0)],
    ['div', Number(b.div || 0)],
  ];
  entries.sort((x, y) => x[1] - y[1]); // lowest count = weakest
  return entries[0]?.[0] || 'add';
}

const SAMPLE_NAMES = [
  'Ryan', 'Daniel', 'Chloe', 'Mia', 'Joy', 'Grace', 'Olivia', 'Ethan', 'Ava', 'Noah',
  'Liam', 'Sofia', 'Isabella', 'Lucas', 'Zoe', 'Jayden', 'Emily', 'Ivan', 'Hannah', 'Ben'
];

async function ensureTrialSeedData(trialUserId) {
  if (!trialUserId) return;

  // Ensure exactly two classes
  let classes = await TrialClass.find({ trial_user_id: trialUserId }).sort({ class_name: 1 });
  const names = ['Trial Class 1', 'Trial Class 2'];

  for (const name of names) {
    if (!classes.some((c) => c.class_name === name)) {
      await TrialClass.create({ trial_user_id: trialUserId, class_name: name });
    }
  }

  classes = await TrialClass.find({ trial_user_id: trialUserId }).sort({ class_name: 1 });

  // Ensure 5-10 sample students per class
  for (let i = 0; i < classes.length; i++) {
    const cls = classes[i];
    const existingSamples = await TrialStudent.find({
      trial_user_id: trialUserId,
      class_id: cls._id,
      is_sample: true,
    });

    const target = randInt(5, 10);
    const toCreate = [];
    for (let k = existingSamples.length; k < target; k++) {
      const name = SAMPLE_NAMES[(i * 10 + k) % SAMPLE_NAMES.length] + ` ${randInt(10, 99)}`;
      const profile = randInt(1, 5);
      const breakdown = randBreakdown();
const weakest = computeWeakestTopic(breakdown);
toCreate.push({
  trial_user_id: trialUserId,
  class_id: cls._id,
  name,
  is_sample: true,
  profile,
  attempts_today: 0,
  last_attempt_date: null,
  last_score: randInt(35, 100),
  last_operation_breakdown: breakdown,
  assigned_adaptive_topics: [weakest],
});
    }
    if (toCreate.length) await TrialStudent.insertMany(toCreate);
  }


// Backfill assigned topics for any existing sample students (older DBs)
const samplesNeedingTopics = await TrialStudent.find({
  trial_user_id: trialUserId,
  is_sample: true,
  $or: [
    { assigned_adaptive_topics: { $exists: false } },
    { assigned_adaptive_topics: { $size: 0 } },
  ],
}).lean();

for (const s of samplesNeedingTopics) {
  const weakest = computeWeakestTopic(s.last_operation_breakdown);
  await TrialStudent.updateOne(
    { _id: s._id },
    { $set: { assigned_adaptive_topics: [weakest] } }
  );
}


// Backfill class_id for any existing playable students (older DBs) so they show in teacher class leaderboards.
const firstClassId = classes?.[0]?._id || null;
if (firstClassId) {
  await TrialStudent.updateMany(
    { trial_user_id: trialUserId, is_sample: false, $or: [{ class_id: null }, { class_id: { $exists: false } }] },
    { $set: { class_id: firstClassId } }
  );
}

  // Ensure 3 playable students total (is_sample=false)
  const playable = await TrialStudent.find({ trial_user_id: trialUserId, is_sample: false }).sort({ created_at: 1 });
  const playableToCreate = [];
  for (let i = playable.length; i < 3; i++) {
    const cls = classes[i % classes.length];
    playableToCreate.push({
      trial_user_id: trialUserId,
      class_id: cls?._id || null,
      name: `${SAMPLE_NAMES[(i + randInt(0, SAMPLE_NAMES.length-1)) % SAMPLE_NAMES.length]} ${randInt(10, 99)}`,
      is_sample: false,
      profile: 1,
      attempts_today: 0,
      last_attempt_date: null,
      last_score: null,
      last_operation_breakdown: { add: 0, sub: 0, mul: 0, div: 0 },
      assigned_adaptive_topics: [],
    });
  }
  if (playableToCreate.length) await TrialStudent.insertMany(playableToCreate);

  return true;
}

module.exports = { ensureTrialSeedData };
