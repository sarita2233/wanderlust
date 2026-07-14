const Listing = require("../models/listing");
const axios = require("axios");

module.exports.index = async(req,res) =>{
    const allListings =await Listing.find({});
    res.render("listings/index.ejs",{allListings});
};
    module.exports.renderNewForm =(req,res)=>{
    res.render("listings/new.ejs");
};
module.exports.showListing =async(req,res) =>{
let {id} =req.params;
const listing = await Listing.findById(id)
.populate({
path:"reviews",
populate:{
    path:"author",
},
})
.populate("owner");
if(!listing){
req.flash("error", "Listing you requested for does not exist!");
return res.redirect("/listings");
}
console.log(listing);
res.render("listings/show.ejs",{listing});
};

module.exports.createListing =async (req,res,next) =>{
 let location = req.body.listing.location;
 let response;
 try{
response =await axios.get(
    "https://nominatim.openstreetmap.org/search"
,{
    params:{
        q:location,
    format:"json",
    limit:1,
    },
    headers:{
        "User-Agent": "Wanderlust-App/1.0",
      },timeout:10000
    }
    );

console.log(response.data);
 }catch(err){
    console.log(err.message);
 }

    if (response.data.length === 0) {
    req.flash("error", "Invalid location");
    return res.redirect("/listings/new");
}

let url = req.file.path;
let filename = req.file.filename;

 const newListing =new Listing(req.body.listing);
 
 newListing.owner = req.user._id;
 newListing.image ={url, filename};
 //const coords = await getCoordinates(newListing.location);
 //if(coords){
     newListing.geometry ={
   type:"Point",
  coordinates:[
    parseFloat(response.data[0].lon),
      parseFloat(response.data[0].lat),
  ],
     };
 //newListing.geometry = response.body.features[0].geometry;
let savedListing = await newListing.save();
 console.log(savedListing);
req.flash("success","New Listing Created!");
return res.redirect("/listings");

    };

module.exports.renderEditForm = async(req,res) => {
let {id} =req.params;
const listing = await Listing.findById(id); 
if(!listing){
req.flash("error", "Listing you requested for does not exist!");
return res.redirect("/listings");
}
let originalImageUrl = listing.image.url;
originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
res.render("listings/edit.ejs",{listing,originalImageUrl});
};

module.exports.updateListing =async(req,res) =>{
let {id} = req.params;
let listing =await Listing.findByIdAndUpdate(id,{...req.body.listing});

if(typeof req.file !== "undefined"){
let url = req.file.path;
let filename = req.file.filename;
listing.image ={url, filename};
await listing.save();
}
req.flash("success","Listing updeted!");
res. redirect(`/listings/${id}`);
};

module.exports.destroyListing =async(req,res) =>{
    let {id} = req.params;
    let deletedListing =await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
     req.flash("success","New Listing deleted!");
    res.redirect("/listings");
};