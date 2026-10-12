const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const DoseLog = require('../models/DoseLog');

const getSummary = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const pipeline = [
      { $match: { userId } },
      { $facet: {
        totalMedicines: [{ $count: "count" }],
        expired: [
          { $match: { expiry: { $lt: now } } },
          { $count: "count" }
        ],
        expiringSoon: [
          { $match: { expiry: { $gte: now, $lte: thirtyDaysFromNow } } },
          { $count: "count" }
        ],
        lowStock: [
          { $match: { $expr: { $lte: ["$quantity", "$threshold"] }, quantity: { $gt: 0 } } },
          { $count: "count" }
        ]
      }}
    ];

    const result = await Medicine.aggregate(pipeline);
    const data = {
      totalMedicines: result[0].totalMedicines[0]?.count || 0,
      expired: result[0].expired[0]?.count || 0,
      expiringSoon: result[0].expiringSoon[0]?.count || 0,
      lowStock: result[0].lowStock[0]?.count || 0,
    };

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getAdherence = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const days = parseInt(req.query.days) || 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const pipeline = [
      { $match: { userId, scheduledFor: { $gte: fromDate } } },
      { $lookup: {
          from: 'schedules',
          localField: 'scheduleId',
          foreignField: '_id',
          as: 'schedule'
        }
      },
      { $unwind: "$schedule" },
      { $lookup: {
          from: 'profiles',
          localField: 'schedule.profileId',
          foreignField: '_id',
          as: 'profile'
        }
      },
      { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
      { $group: {
          _id: "$profile._id",
          name: { $first: { $ifNull: ["$profile.name", "General"] } },
          taken: { $sum: { $cond: [{ $eq: ["$status", "taken"] }, 1, 0] } },
          missed: { $sum: { $cond: [{ $eq: ["$status", "missed"] }, 1, 0] } },
          total: { $sum: 1 }
        }
      },
      { $project: {
          _id: 1,
          name: 1,
          taken: 1,
          missed: 1,
          total: 1,
          adherence: { $multiply: [{ $divide: ["$taken", "$total"] }, 100] }
        }
      },
      { $sort: { name: 1 } }
    ];

    const data = await DoseLog.aggregate(pipeline);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getWaste = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();

    const pipeline = [
      { $match: { userId, expiry: { $lt: now } } },
      { $facet: {
        totals: [
          { $group: {
              _id: null,
              totalWastedPrice: { $sum: { $multiply: [{ $ifNull: ["$price", 0] }, "$quantity"] } },
              totalExpiredItems: { $sum: 1 }
            }
          }
        ],
        monthly: [
          { $group: {
              _id: {
                year: { $year: "$expiry" },
                month: { $month: "$expiry" }
              },
              count: { $sum: 1 },
              cost: { $sum: { $multiply: [{ $ifNull: ["$price", 0] }, "$quantity"] } }
            }
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
          { $project: {
              _id: 0,
              year: "$_id.year",
              month: "$_id.month",
              count: 1,
              cost: 1,
              label: { $concat: [ { $toString: "$_id.month" }, "/", { $toString: "$_id.year" } ] }
            }
          }
        ]
      }}
    ];

    const result = await Medicine.aggregate(pipeline);
    const data = {
      totalWastedPrice: result[0].totals[0]?.totalWastedPrice || 0,
      totalExpiredItems: result[0].totals[0]?.totalExpiredItems || 0,
      monthly: result[0].monthly || []
    };

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getAdherence, getWaste };
