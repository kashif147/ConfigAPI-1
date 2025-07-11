// const LookupType = require('../model/LookupType');

// const getAllLookupType = async (req, res) =>
// {
//     try {
//         const lookupTypes = await LookupType.find();
//         if (!lookupTypes) return res.status(204).json({ 'message': 'No Lookup types found.' });
//         res.json(lookupTypes);
//       }
//       catch (error) {
//         res.status(500).json({ error: 'Server error' });
//       }
// }

// const getLookupType =  async (req, res) => {
//     try {
//         const { id } = req.params;
//         const lookupType = await LookupType.findById(id);
//         if (!lookupType) {
//           return res.status(404).json({ error: 'LookupType not found' });
//         }
//         res.json(lookupType);
//       } catch (error) {
//         res.status(500).json({ error: 'Server error' });
//       }
// }

// const createNewLookupType =  async (req, res) => {
//     try {
//         const { code, lookuptype, DisplayName, isdeleted, isactive, userid } = req.body;

//         // Validate required fields
//         if (!code || !lookuptype || !userid) {
//            return res.status(400).json({ error: 'Code, LookupType, User ID are required' });
//          }

//         // Assign fields individually to control which properties are saved
//         const lookupType = await LookupType.create({
//           code: req.body.code,
//           lookuptype: req.body.lookuptype,
//           DisplayName: req.body.DisplayName,
//           isdeleted: req.body.isdeleted || false, // Defaults to false if not provided
//           isactive: req.body.isactive || true, // Defaults to true if not provided
//           userid: req.body.userid
//         });

//         res.status(201).json(lookupType);
//       } catch (error) {
//         if (error.name === 'ValidationError') {
//           return res.status(400).json({ error: error.message });
//         }
//         if (error.code === 11000) {
//           // Duplicate key error for 'code' field
//           return res.status(400).json({ error: 'Code must be unique' });
//         }
//         if (error.lookuptype === 11000) {
//           // Duplicate key error for 'code' field
//           return res.status(400).json({ error: 'Code must be unique' });
//         }
//         res.status(500).json({ error: 'Server error' });
//       }
// }

// const updateLookupType = async (req, res) => {
//     try {
//         const { id, code, lookuptype, displayname, isdeleted, isactive, userid } = req.body;
//         // Find the LookupType document by ID
//         const lookupTypes = await LookupType.findById(id);
//         if (!lookupTypes) {
//         return res.status(404).json({ error: 'LookupType not found' });
//         }

//         // Update fields individually only if they are provided in the request
//         if (code) lookupTypes.code = code;
//         if (lookuptype) lookupTypes.lookuptype = lookuptype;
//         if (displayname) lookupTypes.displayname = displayname;
//         if (typeof isdeleted !== 'undefined') lookupTypes.isdeleted = isdeleted;
//         if (typeof isactive !== 'undefined') lookupTypes.isactive = isactive;
//         if (userid) lookupTypes.userid = userid;

//         // Save the updated document, applying validation
//         await lookupTypes.save();
//         res.json(lookupTypes);
//     } catch (error) {
//         if (error.name === 'ValidationError') {
//         return res.status(400).json({ error: error.message });
//         }
//         res.status(500).json({ error: 'Server error' });
//     }
// }

// const deleteLookupType = async (req, res) => {
//     if (!req?.body?.id) return res.status(400).json({ 'message': 'LookupType ID required.'});

//     const lookuptype = await LookupType.findOne({ _id: req.body.id}).exec();
//     if (!lookuptype) {
//         return res.status(240).json({ "message": ` No lookuptype matches ID ${req.body.id}. ` });
//     }

//    const result = await lookuptype.deleteOne({ _id: req.body.id });
//     res.json(result);
// }

// module.exports = {
//       getAllLookupType,
//       getLookupType,
//       createNewLookupType,
//       updateLookupType,
//       deleteLookupType
//    }

const LookupType = require("../model/LookupType");
const {
  emitLookupTypeCreatedEvent,
  emitLookupTypeUpdatedEvent,
  emitLookupTypeDeletedEvent,
} = require("../rabbitMQ/events/lookupTypeEvents");

const getAllLookupType = async (req, res) => {
  try {
    const lookupTypes = await LookupType.find();
    if (!lookupTypes) return res.status(204).json({ message: "No Lookup types found." });
    res.json(lookupTypes);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const getLookupType = async (req, res) => {
  try {
    const { id } = req.params;
    const lookupType = await LookupType.findById(id);
    if (!lookupType) {
      return res.status(404).json({ error: "LookupType not found" });
    }
    res.json(lookupType);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const createNewLookupType = async (req, res) => {
  try {
    const { code, lookuptype, DisplayName, isdeleted, isactive, userid } = req.body;

    // Validate required fields
    if (!code || !lookuptype || !userid) {
      return res.status(400).json({ error: "Code, LookupType, User ID are required" });
    }

    // Assign fields individually to control which properties are saved
    const lookupType = await LookupType.create({
      code: req.body.code,
      lookuptype: req.body.lookuptype,
      displayname: req.body.DisplayName,
      isdeleted: req.body.isdeleted || false,
      isactive: req.body.isactive || true,
      userid: req.body.userid,
    });

    try {
      await emitLookupTypeCreatedEvent({
        lookupTypeId: lookupType._id,
        code: lookupType.code,
        lookuptype: lookupType.lookuptype,
        displayname: lookupType.displayname,
        userid: lookupType.userid,
        timestamp: new Date(),
      });
    } catch (eventError) {
      console.error("Failed to emit lookup type created event:", eventError);
    }

    res.status(201).json(lookupType);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ error: "Code must be unique" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

const updateLookupType = async (req, res) => {
  try {
    const { id, code, lookuptype, displayname, isdeleted, isactive, userid } = req.body;
    // Find the LookupType document by ID
    const lookupTypes = await LookupType.findById(id);
    if (!lookupTypes) {
      return res.status(404).json({ error: "LookupType not found" });
    }

    // Store old values for audit
    const oldValues = {
      code: lookupTypes.code,
      lookuptype: lookupTypes.lookuptype,
      displayname: lookupTypes.displayname,
      isdeleted: lookupTypes.isdeleted,
      isactive: lookupTypes.isactive,
    };

    // Update fields individually only if they are provided in the request
    if (code) lookupTypes.code = code;
    if (lookuptype) lookupTypes.lookuptype = lookuptype;
    if (displayname) lookupTypes.displayname = displayname;
    if (typeof isdeleted !== "undefined") lookupTypes.isdeleted = isdeleted;
    if (typeof isactive !== "undefined") lookupTypes.isactive = isactive;
    if (userid) lookupTypes.userid = userid;

    // Save the updated document, applying validation
    await lookupTypes.save();

    // Emit event for audit logging
    await emitLookupTypeUpdatedEvent({
      lookupTypeId: lookupTypes._id,
      oldValues,
      newValues: {
        code: lookupTypes.code,
        lookuptype: lookupTypes.lookuptype,
        displayname: lookupTypes.displayname,
        isdeleted: lookupTypes.isdeleted,
        isactive: lookupTypes.isactive,
      },
      userid: lookupTypes.userid,
      timestamp: new Date(),
    });

    res.json(lookupTypes);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error" });
  }
};

const deleteLookupType = async (req, res) => {
  if (!req?.body?.id) return res.status(400).json({ message: "LookupType ID required." });

  const lookuptype = await LookupType.findOne({ _id: req.body.id }).exec();
  if (!lookuptype) {
    return res.status(240).json({ message: ` No lookuptype matches ID ${req.body.id}. ` });
  }

  // Store values for audit before deletion
  const deletedLookupType = {
    lookupTypeId: lookuptype._id,
    code: lookuptype.code,
    lookuptype: lookuptype.lookuptype,
    displayname: lookuptype.displayname,
    userid: lookuptype.userid,
    timestamp: new Date(),
  };

  const result = await lookuptype.deleteOne({ _id: req.body.id });

  // Emit event for audit logging
  await emitLookupTypeDeletedEvent(deletedLookupType);

  res.json(result);
};

module.exports = {
  getAllLookupType,
  getLookupType,
  createNewLookupType,
  updateLookupType,
  deleteLookupType,
};
