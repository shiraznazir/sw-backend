
// Middleware to validate image files (front_image, back_image)
export default function validateFiles(req, res, next) {
  const files = req.files;

  // Check if the required files (front_image and back_image) are provided
  if (!files?.front_image || !files?.back_image) {
    return res.status(400).json({ message: 'Both front_image and back_image are required.' });
  }

  // Check if both files are images (MIME type validation)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const frontImageType = files.front_image[0]?.mimetype;
  const backImageType = files.back_image[0]?.mimetype;

  if (!allowedTypes.includes(frontImageType) || !allowedTypes.includes(backImageType)) {
    return res.status(400).json({ message: 'Both files must be valid image types (JPEG, PNG, GIF).' });
  }

  // Check if the images are within the size limits (5MB for example)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  const frontImageSize = files.front_image[0]?.size;
  const backImageSize = files.back_image[0]?.size;

  if (frontImageSize > maxSize || backImageSize > maxSize) {
    return res.status(400).json({ message: 'Image files must be smaller than 5MB.' });
  }

  next();
}
