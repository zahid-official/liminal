import { FaCloudUploadAlt, FaPlus, FaTrash } from "react-icons/fa";
import { useForm } from "react-hook-form";
import { useState, useEffect, useRef } from "react";
import useAxiosSecure from "../../Auth/Hook/useAxiosSecure";
import { toast } from "react-toastify";

const AddProject = () => {
  const axiosSecure = useAxiosSecure();

  // form handling hooks
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    clearErrors,
    reset,
  } = useForm();

  // state to store the selected file
  const [bannerImage, setBannerImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);

  // state to store the preview URL of the selected
  const [previewBannerImage, setPreviewBannerImage] = useState(null);
  const [previewAdditionalImages, setPreviewAdditionalImages] = useState([]);

  // ref to reset input field
  const bannerImageRef = useRef(null);
  const additionalImagesRef = useRef(null);

  // state for project uploading
  const [uploading, setUploading] = useState(false);

  // observer for status
  const watchStatus = watch("status");

  // handleBannerImage
  const handleBannerImage = (event) => {
    const file = event.target.files[0];
    setBannerImage(file);
    setPreviewBannerImage(URL.createObjectURL(file));
    setValue("bannerImage", file, { shouldValidate: true });
  };

  // removeBannerImage
  const removeBannerImage = () => {
    if (previewBannerImage) {
      URL.revokeObjectURL(previewBannerImage);
    }
    setBannerImage(null);
    setPreviewBannerImage(null);
    setValue("bannerImage", null, { shouldValidate: true });

    // reset input field
    if (bannerImageRef.current) {
      bannerImageRef.current.value = "";
    }
  };

  // handleAdditionalImages
  const handleAdditionalImages = (event) => {
    const files = Array.from(event.target.files);

    // filter out duplicate files
    const filteredFiles = files.filter(
      (newFile) =>
        !additionalImages.some(
          (existingFile) =>
            existingFile.name === newFile.name &&
            existingFile.lastModified === newFile.lastModified
        )
    );

    const updatedFiles = [...additionalImages, ...filteredFiles];
    setAdditionalImages(updatedFiles);
    setValue("additionalImages", updatedFiles, { shouldValidate: true });

    // generate & store preview URLs of the selected images
    const previewURLs = filteredFiles.map((file) => URL.createObjectURL(file));
    setPreviewAdditionalImages((prev) => [...prev, ...previewURLs]);
  };

  // removeAdditionalImage
  const removeAdditionalImage = (index) => {
    URL.revokeObjectURL(previewAdditionalImages[index]);

    const newFiles = additionalImages.filter((_, idx) => idx !== index);
    const newPreviews = previewAdditionalImages.filter(
      (_, idx) => idx !== index
    );

    setAdditionalImages(newFiles);
    setPreviewAdditionalImages(newPreviews);
    setValue("additionalImages", newFiles, { shouldValidate: true });

    // reset input field
    if (additionalImagesRef.current) {
      additionalImagesRef.current.value = "";
    }
  };

  // onSubmit
  const onSubmit = async (formData) => {
    if (!bannerImage || additionalImages.length === 0) return;
    setUploading(true);

    try {
      // upload banner image in cloudinary
      const bannerForm = new FormData();
      bannerForm.append("bannerImage", bannerImage);
      const bannerRes = await axiosSecure.post(
        "/uploadBannerImage",
        bannerForm,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const bannerURL = bannerRes.data.bannerURL;

      // upload additional images in cloudinary
      const additionalForm = new FormData();
      additionalImages.forEach((img) =>
        additionalForm.append("additionalImages", img)
      );
      const additionalRes = await axiosSecure.post(
        "/uploadAdditionalImages",
        additionalForm,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const additionalURLs = additionalRes.data.additionalURLs;

      // Submit project data with uploaded URLs
      try {
        const projectData = {
          ...formData,
          bannerImage: bannerURL,
          additionalImages: additionalURLs,
        };

        const res = await axiosSecure.post("/addProject", projectData);

        if (res.data.insertedId) {
          toast.success("Project Added Successfully");

          // reset states
          setBannerImage(null);
          setPreviewBannerImage(null);
          setAdditionalImages([]);
          setPreviewAdditionalImages([]);

          // form input field
          if (bannerImageRef.current) {
            bannerImageRef.current.value = "";
          }
          if (additionalImagesRef.current) {
            additionalImagesRef.current.value = "";
          }

          reset();
        }
      } catch (projectError) {
        console.error("Project submission failed:", projectError);
        toast.error("Project data submission failed. Please try again.");
      }
    } catch (error) {
      console.error("Upload or submission failed:", error);
      toast.error("Uploading or submission failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // useEffect to required bannerImage & additionalImages
  useEffect(() => {
    register("bannerImage", { required: "banner image is required" });

    register("additionalImages", {
      required: "additional images are required",
      validate: (files) =>
        files.length === 5 || "Exactly 5 images are required",
    });

    if (watchStatus !== "Completed") {
      clearErrors("description");
      setValue("description", "");
    }
  }, [register, watchStatus, setValue, clearErrors]);

  return (
    <div className="container mx-auto py-20 mt-4 max-w-4xl sm:px-10 px-4">
      {/* intro */}
      <div className="text-center">
        <h2 className="text-3xl font-semibold">Add New Project</h2>
        <p className="py-1">Enter the details to create your new project</p>
      </div>

      {/* form */}
      <div className="card bg-base-100 w-full border mt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="card-body">
          <fieldset className="fieldset space-y-4">
            {/* banner image */}
            <div>
              <label className="label font-semibold text-lg">
                Banner Image
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                <input
                  type="file"
                  id="bannerImage"
                  className="hidden"
                  accept="image/*"
                  onChange={handleBannerImage}
                  ref={bannerImageRef}
                />

                {bannerImage ? (
                  <div className="relative">
                    <img
                      src={previewBannerImage}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded"
                    />
                    <button
                      type="button"
                      onClick={removeBannerImage}
                      className="absolute top-1 right-1 bg-red-500 text-white p-2 rounded-full"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="bannerImage"
                    className="cursor-pointer flex flex-col items-center justify-center py-6"
                  >
                    <FaCloudUploadAlt className="text-4xl text-gray-400 mb-2" />
                    <span className="text-gray-500">
                      Click to upload banner image
                    </span>
                  </label>
                )}
              </div>
              {errors.bannerImage && (
                <p className="text-red-600 text-sm pt-2">
                  * {errors.bannerImage.message}
                </p>
              )}
            </div>

            {/* title */}
            <div>
              <label className="label font-semibold text-lg">Title</label>
              <input
                type="text"
                className="input input-bordered w-full text-sm"
                placeholder="Enter project title"
                {...register("title", { required: "title is required" })}
              />
              {errors.title && (
                <p className="text-red-600 text-sm pt-2">
                  * {errors.title.message}
                </p>
              )}
            </div>

            <div className="flex sm:flex-row flex-col gap-5">
              {/* category */}
              <div className="w-full">
                <label className="label font-semibold text-lg">Category</label>
                <input
                  type="text"
                  className="input input-bordered w-full text-sm"
                  placeholder="Enter the category this project belongs to"
                  {...register("category", {
                    required: "category is required",
                  })}
                />
                {errors.category && (
                  <p className="text-red-600 text-sm pt-2">
                    * {errors.category.message}
                  </p>
                )}
              </div>

              {/* status */}
              <div className="w-full">
                <label className="label font-semibold text-lg">Status</label>
                <select
                  defaultValue=""
                  className="select select-md w-full input-bordered text-sm"
                  {...register("status", {
                    required: "status is required",
                  })}
                >
                  <option value="" disabled>
                    Select Current Status
                  </option>
                  <option value="Ongoing">Ongoing Project</option>
                  <option value="Completed">Completed</option>
                </select>

                {errors.status && (
                  <p className="text-red-600 text-sm pt-2">
                    * {errors.status.message}
                  </p>
                )}
              </div>
            </div>

            {/* description if completed */}
            <div>
              <label className="label font-semibold text-lg">Description</label>
              <textarea
                placeholder="Write a short description about your project"
                className={`textarea textarea-md w-full input-bordered ${
                  watchStatus !== "Completed"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : ""
                }`}
                rows={4}
                disabled={watchStatus !== "Completed"}
                {...register("description", {
                  validate: (value) => {
                    if (watchStatus === "Completed" && !value) {
                      return "description is required for completed projects";
                    }
                    return true;
                  },
                })}
              />

              {errors.description && (
                <p className="text-red-600 text-sm pt-2">
                  * {errors.description.message}
                </p>
              )}
            </div>

            {/* Additional Images */}
            <div className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
                Additional Images
              </label>

              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <input
                  type="file"
                  id="additionalImages"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleAdditionalImages}
                  ref={additionalImagesRef}
                />

                <label
                  htmlFor="additionalImages"
                  className="cursor-pointer flex items-center justify-center py-4 bg-gray-100 dark:bg-gray-800 rounded-md"
                >
                  <FaPlus className="mr-2" />
                  <span>Add Images</span>
                </label>

                {additionalImages.length > 0 && (
                  <div className="flex flex-wrap gap-5 pt-5">
                    {previewAdditionalImages.map((previewURL, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={previewURL}
                          className="max-h-32 object-cover rounded"
                          alt={`preview-${idx}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeAdditionalImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1.5 text-xs rounded-full"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errors.additionalImages && (
                <p className="text-red-600 text-sm pt-2">
                  * {errors.additionalImages.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div>
              <button
                disabled={uploading}
                className="btn bg-[#154434] hover:bg-[#0d2c22] text-white text-base mt-6 w-full"
              >
                {uploading ? (
                  <>
                    Uploading
                    <span className="loading loading-spinner loading-md"></span>
                  </>
                ) : (
                  "Add Project"
                )}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default AddProject;
