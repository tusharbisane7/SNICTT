const cloudinary =
  require("../config/cloudinary");

// =========================================================
// GET CLOUDINARY URL
// =========================================================

const getCloudinaryUrl = (
  file
) => {
  if (!file) {
    return null;
  }

  return (
    file.path ||
    file.secure_url ||
    file.url ||
    null
  );
};

// =========================================================
// EXTRACT PUBLIC ID
// =========================================================

const getPublicIdFromUrl = (
  imageUrl
) => {
  if (
    !imageUrl ||
    !String(imageUrl).includes(
      "res.cloudinary.com"
    )
  ) {
    return null;
  }

  try {
    const url =
      new URL(imageUrl);

    const pathname =
      url.pathname;

    const uploadMarker =
      "/upload/";

    const index =
      pathname.indexOf(
        uploadMarker
      );

    if (index === -1) {
      return null;
    }

    let publicPath =
      pathname.substring(
        index +
          uploadMarker.length
      );

    const parts =
      publicPath.split("/");

    // Remove version
    if (
      parts[0] &&
      /^v\d+$/.test(
        parts[0]
      )
    ) {
      parts.shift();
    }

    publicPath =
      parts.join("/");

    // Remove extension
    publicPath =
      publicPath.replace(
        /\.(jpg|jpeg|png|webp|gif)$/i,
        ""
      );

    return (
      publicPath || null
    );
  } catch (error) {
    console.error(
      "Cloudinary public ID extraction error:",
      error.message
    );

    return null;
  }
};

// =========================================================
// DELETE IMAGE
// =========================================================

const deleteCloudinaryImage =
  async (
    imageUrl
  ) => {
    const publicId =
      getPublicIdFromUrl(
        imageUrl
      );

    if (!publicId) {
      return false;
    }

    try {
      const result =
        await cloudinary.uploader.destroy(
          publicId,
          {
            resource_type:
              "image",
          }
        );

      console.log(
        "Cloudinary delete:",
        publicId,
        result.result
      );

      return (
        result.result ===
        "ok"
      );
    } catch (error) {
      console.error(
        "Cloudinary delete error:",
        error.message
      );

      return false;
    }
  };

module.exports = {
  getCloudinaryUrl,
  getPublicIdFromUrl,
  deleteCloudinaryImage,
};