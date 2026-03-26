const Suc = require('../models/Suc');

// OCC Officials lookup — used for transfers
const OCC_OFFICIALS = {
  'OCSCA': { name: 'Chairperson Shirley C. Agrupis', section: 'Chairperson' },
  'OCDRA': { name: 'Commissioner Desiderio R. Apag III', section: 'Commissioner' },
  'OCRPA': { name: 'Commissioner Ricmar P. Aquino', section: 'Commissioner' },
  'OCMQM': { name: 'Commissioner Myrna Q. Mallari', section: 'Commissioner' },
  'OCMAO': { name: 'Commissioner Michelle Aguilar-Ong', section: 'Commissioner' },
};

const REGION_ORDER = ['NCR','1','2','3','4','MIMAROPA','5','6','NIR','7','8','9','10','11','12','CAR','CARAGA','BARMM'];

const sortByRegion = (sucs) => {
  return sucs.sort((a, b) => {
    const idxA = REGION_ORDER.indexOf(a.region);
    const idxB = REGION_ORDER.indexOf(b.region);
    const posA = idxA === -1 ? REGION_ORDER.length : idxA;
    const posB = idxB === -1 ? REGION_ORDER.length : idxB;
    return posA - posB;
  });
};

// GET all SUCs (authenticated)
exports.getAllSucs = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'admin' && req.user.occCode) {
      // Commissioner: sees only their SUCs
      filter.occCode = req.user.occCode;
    } else if (req.user.role === 'user' && req.user.sucAbbreviation) {
      // SUC user: sees only their own SUC
      filter.abbreviation = req.user.sucAbbreviation;
    }
    // superadmin: no filter — sees everything
    const sucs = await Suc.find(filter);
    res.json(sortByRegion(sucs));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET public SUC list (limited fields)
exports.getPublicSucs = async (req, res) => {
  try {
    const { region } = req.query;
    const filter = region ? { region } : {};
    const sucs = await Suc.find(filter).select('sucName abbreviation region address president occCode chedOfficial');
    res.json(sortByRegion(sucs));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST create SUC
exports.createSuc = async (req, res) => {
  try {
    const { sucName, abbreviation, region, address, president, email, contact,
            boardSecretaryName, boardSecretaryEmail, boardSecretaryContact,
            dateOfBoardMeeting, occCode, chedOfficial, section } = req.body;
    if (!sucName || !region || !section) {
      return res.status(400).json({ message: 'Required fields: sucName, region, section' });
    }
    const suc = await Suc.create({ sucName, abbreviation, region, address, president, email, contact,
      boardSecretaryName, boardSecretaryEmail, boardSecretaryContact,
      dateOfBoardMeeting, occCode, chedOfficial, section });
    res.status(201).json(suc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT update SUC
exports.updateSuc = async (req, res) => {
  try {
    const suc = await Suc.findById(req.params.id);
    if (!suc) return res.status(404).json({ message: 'SUC not found' });

    // Users can only edit Chairperson/Commissioner sections
    if (req.user.role === 'user') {
      if (!['Chairperson', 'Commissioner'].includes(suc.section)) {
        return res.status(403).json({ message: 'You can only edit Chairperson or Commissioner SUCs' });
      }
    }

    const { sucName, abbreviation, region, address, president, email, contact,
            boardSecretaryName, boardSecretaryEmail, boardSecretaryContact,
            dateOfBoardMeeting, occCode, chedOfficial, section } = req.body;
    Object.assign(suc, {
      ...(sucName && { sucName }),
      ...(abbreviation !== undefined && { abbreviation }),
      ...(region && { region }),
      ...(address !== undefined && { address }),
      ...(president !== undefined && { president }),
      ...(email !== undefined && { email }),
      ...(contact !== undefined && { contact }),
      ...(boardSecretaryName !== undefined && { boardSecretaryName }),
      ...(boardSecretaryEmail !== undefined && { boardSecretaryEmail }),
      ...(boardSecretaryContact !== undefined && { boardSecretaryContact }),
      ...(dateOfBoardMeeting !== undefined && { dateOfBoardMeeting }),
      ...(occCode !== undefined && { occCode }),
      ...(chedOfficial !== undefined && { chedOfficial }),
      ...(section && { section })
    });
    await suc.save();
    res.json(suc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE SUC (admin only)
exports.deleteSuc = async (req, res) => {
  try {
    const suc = await Suc.findByIdAndDelete(req.params.id);
    if (!suc) return res.status(404).json({ message: 'SUC not found' });
    res.json({ message: 'SUC deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET OCC Officials list
exports.getOccOfficials = (req, res) => {
  const list = Object.entries(OCC_OFFICIALS).map(([code, info]) => ({
    code, name: info.name, section: info.section
  }));
  res.json(list);
};

// PUT transfer SUC to another CHED Official (admin only)
exports.transferSuc = async (req, res) => {
  try {
    const { occCode } = req.body;
    if (!occCode) {
      return res.status(400).json({ message: 'OCC code is required' });
    }
    const official = OCC_OFFICIALS[occCode];
    if (!official) {
      return res.status(400).json({ message: 'Invalid OCC code' });
    }
    const suc = await Suc.findById(req.params.id);
    if (!suc) return res.status(404).json({ message: 'SUC not found' });
    suc.occCode = occCode;
    suc.chedOfficial = official.name;
    suc.section = official.section;
    await suc.save();
    res.json(suc);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
