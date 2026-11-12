const Listing = require("../models/listing");

// const mbxGeocoding = require("@maptiler/geocoding-control/maptilersdk");
const mapToken = process.env.MAP_TOKEN;
// const geocodingClient = mbxGeocoding({accessToken:mapToken});

module.exports.index = async(req,res)=>{
    const allListings = await Listing.find({})
   res.render("./listings/index.ejs",{allListings})
};

module.exports.randerNewForm =(req,res)=>{
    res.render("./listings/new.ejs")
};

module.exports.showListing = async(req,res,next)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id)
    .populate({path: "reviews", populate:{
        path: "author",
    },
})
    .populate("owner");
    if(!listing){
          req.flash("error", "Listing you requested for does not exist!"); 
          res.redirect("/listings");
    }else{
        console.log(listing)
    res.render("./listings/show.ejs",{listing});
    }
};

module.exports.createListing = async(req,res,next)=>{

// MapTiler Geocoding
let response = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(
        req.body.listing.location + ", " + req.body.listing.country
    )}.json?key=${process.env.MAP_TOKEN}&limit=1`
);

let data = await response.json();

    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image ={url,filename};

   newListing.geometry = data.features[0].geometry;

//if(data.features && data.features.length > 0){
  //  newListing.geometry = data.features[0].geometry;
//}   


    let savedListing = await newListing.save();
    console.log(savedListing);

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");

};

module.exports.randerEditForm = async(req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
          req.flash("error", "Listing you requested for does not exist!"); 
          res.redirect("/listings");
    }
    let originalImageListingUrl =  listing.image.url;
     originalImageListingUrl=originalImageListingUrl.replace("/upload", "/upload/h_250,w_250")
    res.render("listings/edit.ejs",{listing, originalImageListingUrl}); 
};

module.exports.updateListing = async(req,res)=>{
     let {id} = req.params;
     let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});

    if( typeof req.file !=="undefined"){ 
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = {url, filename};
    await listing.save();
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async(req,res)=>{
     let {id} = req.params;
     let deletedListing = await Listing.findByIdAndDelete(id);
     console.log(deletedListing);
      req.flash("success", "Listing Deleted");
     res.redirect("/listings");
};