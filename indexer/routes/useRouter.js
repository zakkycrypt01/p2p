import {Router} from 'express';
import UserController from '../controllers/user.controller.js';
import { get } from 'http';
const userRouter = Router();
userRouter

    .post('/addListing', UserController.HttpAddListing)
    .get('/getListings', UserController.HttpGetListings)
    .get('/getListings/:address', UserController.HttpGetListingsbyAddress)
    .get('/getListing/:id', UserController.HttpGetListingById)


export default userRouter;

