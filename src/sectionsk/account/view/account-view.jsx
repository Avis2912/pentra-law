import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { useRef, useState, useEffect } from 'react';
import { posts } from 'src/_mock/lists';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box'

import { db, auth } from 'src/firebase-config/firebase';
import { getDocs, collection, doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, getStorage, deleteObject, uploadString } from 'firebase/storage'; // Import necessary Firebase Storage functions


import Iconify from 'src/components/iconify';

import PostCard from '../post-card';
import PostSort from '../post-sort';
import PostSearch from '../post-search';

// ----------------------------------------------------------------------



export default function AccountView() {

  const [profileSrc, setProfileSrc] = useState(null); // state for profile image
  const fileInputRef = useRef(); // reference to the file input

  const [brand, setBrand] = useState();

  const [userName, setUserName] = useState(brand ? brand.user_name : null);
  const [brandName, setBrandName] = useState(brand ? brand.brand_name : null);
  const [giftMessage, setGiftMessage] = useState(brand ? brand.messages.gift : null);
  const [sponsorMessage, setSponsorMessage] = useState(brand ? brand.messages.sponsor : null);
  const [defaultMessage, setDefaultMessage] = useState(brand ? brand.messages.default : null);



  const brandsData = collection(db, 'brands');
  const storage = getStorage();
  

  useEffect(() => {

  const getBrandInfo = async () => {
    try {
      const data = await getDocs(brandsData);
      const userDoc = data.docs.find((docc) => docc.id === auth.currentUser.email);
      if (userDoc) {
        // ... your existing logic ...
        setBrand(userDoc.data());
  
        // Check for image in Firebase Storage
        const imageRef = ref(storage, `brands/${auth.currentUser.email}/${auth.currentUser.email}`);
        getDownloadURL(imageRef).then(downloadURL => {
          setProfileSrc(downloadURL); // set the image from Firebase Storage if it exists
        }).catch(error => {
          setProfileSrc('/assets/images/avatars/avatar_20.jpg');
          // If error is 'object-not-found', it means image doesn't exist in storage, so we use the default image.
          if (error.code !== 'storage/object-not-found') {
            console.error("Error fetching profile image:", error);
          }
        });
      } else {
        alert('Error: User not found.');
      }
    } catch (err) {
      alert(err);
    }
  };
    getBrandInfo();
  }, [brandsData, storage])


//    const handleImageUpload = async () => {
//   if (fileInputRef.current.files[0]) {
//     const file = fileInputRef.current.files[0];
    
//     // Create a storage reference
//     const storageRef = ref(storage, `brands/${auth.currentUser.email}`);
    
//     // Upload the file
//     await uploadBytes(storageRef, file);
    
//     // After upload, if you wish to set the new image URL to profileSrc state
//     const downloadURL = await getDownloadURL(storageRef);
//     setProfileSrc(downloadURL);
//   }
// }

const uploadProfilePicture = async () => {
  try {
    // Upload the profile image to Firebase Storage
    const storageRef = ref(storage, `brands/${auth.currentUser.email}/${auth.currentUser.email}`); // Setting the image name to user's email

    // Check if image already exists and delete it
    const previousImageRef = ref(storage, `brands/${auth.currentUser.email}/${auth.currentUser.email}`);
    await deleteObject(previousImageRef).catch(error => {
      // Handle any errors
      if (error.code !== 'storage/object-not-found') {
        console.error("Error deleting previous profile image:", error);
        throw error;
      }
    });

    await uploadString(storageRef, profileSrc, 'data_url');

    // After uploading, get the download URL for the uploaded image
    const imageURL = await getDownloadURL(storageRef);

    // Update Firestore's user document with the image URL (Optional, based on your requirement)
    const userDocRef = doc(db, 'brands', auth.currentUser.email);
    await updateDoc(userDocRef, {
      profileImage: imageURL
    });

  } catch (err) {
    alert(err);
  }
}

const saveChanges = async () => {
  try {
    // Check if a new image was selected by the user
    if (fileInputRef.current?.files[0]) {
      // If a new image was selected, upload it
      await uploadProfilePicture();
    }
    // No else block needed because we don't want to do anything if no new image was selected

    // The rest of the saveChanges logic to update the text fields
    const userDocRef = doc(db, 'brands', auth.currentUser.email);
    const updateData = {};

    if (userName !== null) {
      updateData.user_name = userName;
    }

    if (brandName !== null) {
      updateData.brand_name = brandName;
    }

    if (giftMessage !== null) {
      updateData.messages.gift = giftMessage;
    }

    if (sponsorMessage !== null) {
      updateData.messages.sponsor = sponsorMessage;
    }

    if (defaultMessage !== null) {
      updateData.messages.default = defaultMessage;
    }

    await updateDoc(userDocRef, updateData);

    window.location.href = '/'; // or use your routing logic here

  } catch (err) {
    console.error("Error updating document:", err);
    alert('Error: Unable to save changes.');
  }
}

const handleImageChange = (event) => {
  if (event.target.files && event.target.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => setProfileSrc(e.target.result);
    reader.readAsDataURL(event.target.files[0]);
  }
};

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  

  return (
    
    <Container>
      
      <Stack className='heading' direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h3">My Account</Typography>
        <Button onClick={() => saveChanges()}
        sx={{ marginLeft:'40px' }} variant="contained" color="inherit">
        🎉 Save Changes
          </Button>
      </Stack>
      
      <Stack className='divider' direction="row" spacing={2}>
          
      <Card sx={{ height: 600, width: '35%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <Card sx={{ height: 210, width: 210, mt: 8, boxShadow: 'none' }}>
        
        <input
  type="file"
  ref={fileInputRef}
  onChange={handleImageChange}
  style={{ display: 'none' }}
  accept="image/*"
/>


<Box 
    position="relative" 
    width={210} 
    height={210}
    onClick={handleUploadClick}
    cursor="pointer"
    sx={{
      borderRadius: '50%', // Apply a circular clipping mask
    }}
>
    <Box 
        component="img"
        alt="profile picture"
        src={profileSrc}
        sx={{
            top: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            position: 'absolute',
            borderRadius: '50%',
        }}
    />
    <Iconify icon="solar:camera-bold" 
        sx={{
            width: 30,
            height: 30,
            position: 'absolute', 
            top: '87%', 
            left: '83%',
            transform: 'translate(-50%, -50%)', 
            color: 'grey', // or any contrasting color
        }}
    />

</Box>
       
  </Card>

        

        <TextField
  sx={{ width: '45%', mt: 4, textAlign: 'center', fontFamily: 'Old Standard TT' }}
  id="standard-multiline-flexible"
  label=""
  multiline
  maxRows={1}
  size="small"
  placeholder="Your Name"
  defaultValue={brand ? brand.user_name : null}
  onChange={(e) => setUserName(e.target.value)}
/>

<TextField
  sx={{ width: '45%', mt: 2, textAlign: 'center', fontFamily: 'Old Standard TT' }}
  id="standard-multiline-flexible"
  label=""
  multiline
  maxRows={1}
  size="small"
  placeholder="Brand Name"
  defaultValue={brand ? brand.brand_name : null}
  onChange={(e) => setBrandName(e.target.value)}

/>



        <Typography fontSize="20px" fontWeight={100} mt={3} mb={2} fontFamily="Old Standard TT">
          Current Pentra Plan
        </Typography>

        

        <Button variant="contained" color="primary" onClick={() => alert("please mail us at pentra.beauty@gmail.com! We'll get back to you ASAP.")}>
          Starter | Change Plan
        </Button>

      </Card>




          <Card sx={{ height: 600, width: '65%' }}>

          <Typography fontSize="24px"
           fontWeight={100} mt={5} mx={5} mb={2}
           fontFamily="Old Standard TT"
           >🎁 Gift Message
          </Typography>
          <TextField 
          sx = {{ marginLeft:'38px', width:'89%' }}
          id="outlined-multiline-flexible"
          label=""
          multiline
          minRows={2}
          maxRows={3}
          onChange={(e) => setGiftMessage(e.target.value)}
          defaultValue={brand ? brand.messages.gift : null} />

          <Typography fontSize="24px"
           fontWeight={100} mt={3} mx={5} mb={2}
           fontFamily="Old Standard TT"
           >💸  Sponsor Message
          </Typography>
          <TextField 
          sx = {{ marginLeft:'38px', width:'89%' }}
          id="outlined-multiline-flexible"
          label=""
          multiline
          minRows={2}
          maxRows={3}
          width="50%"
          onChange={(e) => setSponsorMessage(e.target.value)}
          defaultValue={brand ? brand.messages.sponsor : null} />

          <Typography fontSize="24px"
           fontWeight={100} mt={3} mx={5} mb={2}
           fontFamily="Old Standard TT"
           >🖋️  Default Message
          </Typography>
          <TextField 
          sx = {{ marginLeft:'38px', width:'89%' }}
          id="outlined-multiline-flexible"
          label=""
          multiline
          minRows={3}
          maxRows={3}
          onChange={(e) => setDefaultMessage(e.target.value)}
          defaultValue={brand ? brand.messages.default : null} />


          </Card>

      </Stack>
      
    </Container>
  );
}
