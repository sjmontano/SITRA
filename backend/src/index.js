const express = require("express");
const resources = require("./routes/resources");
const app = express();
app.use(express.json());
app.use("/resources", resources);
app.get("/verify/:id", (req, res) => res.redirect(`/resources/verify/${req.params.id}`));
if (require.main === module) app.listen(process.env.PORT || 3000, () => console.log("SITRA backend"));
module.exports = app;
