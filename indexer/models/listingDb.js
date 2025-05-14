import pkg, {Types} from "mongoose";
import dotenv from "dotenv";

const {Schema, model} = pkg;
dotenv.config();

const listingSchema = new Schema({
    id : {
        type: String,
        required: true,
        unique: true
    },
    tokenSymbol: {
        type: String,
        required: true
    },
    tokenIcon: {
        type: String,
        default: "/tokens/default.png"
    },
    amount : {
        type: Number,
        required: true
    },
    price : {
        type: Number,
        required: true
    },
    fiatCurrency : {
        type: String,
        required: true
    },
    paymentMethod : {
        type: [String],
        required: true
    },
    createdAt : {
        type: Date,
        required: true
    },
    orderType : {
        type: String,
        enum: ["buy", "sell"],
        required: true
    },
    address : {
        type: String,
        required: true
    },
    sellerAddress: {
        type: String,
        required: false
    },
    sellerRating: {
        type: Number,
        default: 0
    },
    buyerAddress: {
        type: String,
        required: false
    },
    buyerRating: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: ""
    },
    minAmount: {
        type: Number,
    },
    maxAmount: {
        type: Number,
    },
    expiry: {
        type: Date,
        required: false
    },
    status : {
        type: String,
        enum: ["Active", "Sold","Partially Sold", "Canceled", "Expired"],
        default: "Active"
    },
});

export default model("Listing", listingSchema);