import express from 'express';
import userRoute from './routes/user.js';
// import dkimRoute from './routes/dkim';

const app = express();

app.use(express.json({type: '*/*'}));
app.use(userRoute);

app.listen(process.env.CONTROLLER_PORT || 6804, () => {
  console.log(`Server started on port ${process.env.CONTROLLER_PORT || 6804}`);
})