const Label = require('../../moduals/LabelModel');

class LabelController {

    // 1. Add Label
    async addLabel(req, res) {
        try {
            const { name } = req.body;

            const label = new Label({
                userId: req.userId,
                name
            });

            await label.save();
            res.json({ msg: 'Label created successfully', label });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    // 2. Edit Label
    async editLabel(req, res) {
        try {
            const { labelId } = req.params;
            const updates = req.body;

            const label = await Label.findOneAndUpdate(
                { _id: labelId, userId: req.userId },
                { $set: updates },
                { new: true }
            );

            if (!label) return res.status(404).json({ msg: 'Label not found' });

            res.json({ msg: 'Label updated successfully', label });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    // 3. Delete Label
    async deleteLabel(req, res) {
  try {
    const { labelId } = req.params;

    if (!labelId) {
      return res.status(400).json({ msg: 'Label ID is required' });
    }

    const label = await Label.findOneAndDelete({ _id: labelId, userId: req.userId });

    if (!label) {
      return res.status(404).json({ msg: 'Label not found' });
    }

    res.json({ msg: 'Label deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


    // 4. List Labels for a User
    async listLabels(req, res) {
        try {
            const labels = await Label.find({ userId: req.userId }).sort({ name: 1 });
            res.json(labels);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

}
module.exports = new LabelController();