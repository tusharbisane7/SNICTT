import { useEffect, useState } from "react";

import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Save,
  Image as ImageIcon,
  CalendarDays,
  GripVertical,
  RefreshCw,
  Upload,
} from "lucide-react";

import api from "../../../services/api";

import "./SliderManagement.css";


// =========================================================
// INITIAL FORM
// =========================================================

const initialForm = {
  image: null,
  imageUrl: "",
  title: "",
  description: "",
  slideDate: "",
  displayOrder: 0,
  published: true,
};


// =========================================================
// SLIDER MANAGEMENT
// =========================================================

function SliderManagement() {

  // =======================================================
  // STATES
  // =======================================================

  const [sliders, setSliders] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [form, setForm] =
    useState(initialForm);

  const [imagePreview, setImagePreview] =
    useState("");

  // =======================================================
  // LOAD SLIDERS
  // =======================================================

  const loadSliders = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get(
          "/sliders/admin/all"
        );

      if (
        response.data?.success
      ) {

        setSliders(
          response.data.sliders || []
        );

      } else {

        setSliders([]);

      }

    } catch (error) {

      console.error(
        "Slider loading error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to load sliders."
      );

    } finally {

      setLoading(false);

    }
  };


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {

    loadSliders();

  }, []);


  // =======================================================
  // FORM INPUT
  // =======================================================

  const handleChange = (event) => {

    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

  };


  // =======================================================
  // IMAGE SELECT
  // =======================================================

  const handleImageChange = (
    event
  ) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    // =====================================================
    // VALID IMAGE TYPES
    // =====================================================

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      setError(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      );

      event.target.value = "";

      return;
    }


    // =====================================================
    // FILE SIZE
    // =====================================================

    const maxSize =
      5 * 1024 * 1024;

    if (
      file.size > maxSize
    ) {

      setError(
        "Image size must be less than 5 MB."
      );

      event.target.value = "";

      return;
    }


    setError("");


    // =====================================================
    // SAVE FILE
    // =====================================================

    setForm((previous) => ({
      ...previous,
      image: file,
    }));


    // =====================================================
    // CREATE PREVIEW
    // =====================================================

    const previewUrl =
      URL.createObjectURL(
        file
      );

    setImagePreview(
      previewUrl
    );

  };


  // =======================================================
  // OPEN ADD FORM
  // =======================================================

  const openAddForm = () => {

    setEditingId(null);

    setForm({
      ...initialForm,
    });

    setImagePreview("");

    setError("");
    setSuccess("");

    setShowForm(true);

  };


  // =======================================================
  // OPEN EDIT FORM
  // =======================================================

  const openEditForm = (
    slider
  ) => {

    setEditingId(
      slider.id
    );

    setForm({

      image:
        null,

      imageUrl:
        slider.imageUrl || "",

      title:
        slider.title || "",

      description:
        slider.description || "",

      slideDate:
        slider.slideDate
          ? String(
              slider.slideDate
            ).substring(0, 10)
          : "",

      displayOrder:
        slider.displayOrder ?? 0,

      published:
        Boolean(
          slider.published
        ),

    });


    // Existing image preview

    setImagePreview(
      slider.imageUrl || ""
    );


    setError("");
    setSuccess("");

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  };


  // =======================================================
  // CLOSE FORM
  // =======================================================

  const closeForm = () => {

    if (saving) {
      return;
    }

    setShowForm(false);

    setEditingId(null);

    setForm({
      ...initialForm,
    });

    setImagePreview("");

    setError("");

  };


  // =======================================================
  // VALIDATION
  // =======================================================

  const validateForm = () => {

    // =====================================================
    // CREATE
    // =====================================================

    if (
      !editingId &&
      !form.image
    ) {

      return "Please select a slider image from your desktop.";

    }


    // =====================================================
    // TITLE
    // =====================================================

    if (
      !form.title.trim()
    ) {

      return "Please enter slider title.";

    }


    // =====================================================
    // DISPLAY ORDER
    // =====================================================

    if (
      Number(
        form.displayOrder
      ) < 0
    ) {

      return "Display order cannot be negative.";

    }


    return "";

  };


  // =======================================================
  // SAVE SLIDER
  // =======================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    setError("");
    setSuccess("");


    // =====================================================
    // VALIDATION
    // =====================================================

    const validation =
      validateForm();

    if (validation) {

      setError(
        validation
      );

      return;

    }


    try {

      setSaving(true);


      // ===================================================
      // FORM DATA
      // ===================================================

      const formData =
        new FormData();


      // ===================================================
      // IMAGE
      // ===================================================

      if (form.image) {

        formData.append(
          "image",
          form.image
        );

      }


      // ===================================================
      // TEXT FIELDS
      // ===================================================

      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "description",
        form.description.trim()
      );

      formData.append(
        "slideDate",
        form.slideDate || ""
      );

      formData.append(
        "displayOrder",
        String(
          Number(
            form.displayOrder || 0
          )
        )
      );

      formData.append(
        "published",
        String(
          Boolean(
            form.published
          )
        )
      );


      // ===================================================
      // UPDATE
      // ===================================================

      if (editingId) {

        const response =
          await api.put(
            `/sliders/admin/${editingId}`,
            formData
          );


        if (
          response.data?.success
        ) {

          setSuccess(
            "Slider updated successfully."
          );

        }

      }


      // ===================================================
      // CREATE
      // ===================================================

      else {

        const response =
          await api.post(
            "/sliders/admin",
            formData
          );


        if (
          response.data?.success
        ) {

          setSuccess(
            "Slider created successfully."
          );

        }

      }


      // ===================================================
      // RELOAD
      // ===================================================

      await loadSliders();


      // ===================================================
      // RESET
      // ===================================================

      setShowForm(false);

      setEditingId(null);

      setForm({
        ...initialForm,
      });

      setImagePreview("");


    } catch (error) {

      console.error(
        "Save slider error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to save slider."
      );

    } finally {

      setSaving(false);

    }

  };


  // =======================================================
  // DELETE SLIDER
  // =======================================================

  const handleDelete = async (
    id
  ) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this slider?"
      );

    if (!confirmed) {
      return;
    }


    try {

      setError("");
      setSuccess("");


      await api.delete(
        `/sliders/admin/${id}`
      );


      setSuccess(
        "Slider deleted successfully."
      );


      await loadSliders();

    } catch (error) {

      console.error(
        "Delete slider error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to delete slider."
      );

    }

  };


  // =======================================================
  // TOGGLE PUBLISHED
  // =======================================================

  const handleToggle = async (
    id
  ) => {

    try {

      setError("");
      setSuccess("");


      const response =
        await api.patch(
          `/sliders/admin/${id}/toggle`
        );


      if (
        response.data?.success
      ) {

        setSuccess(
          response.data.message ||
          "Slider status updated."
        );

      }


      await loadSliders();

    } catch (error) {

      console.error(
        "Toggle slider error:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Unable to change slider status."
      );

    }

  };


  // =======================================================
  // FORMAT DATE
  // =======================================================

  const formatDate = (
    value
  ) => {

    if (!value) {
      return "No date";
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "No date";

    }


    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  // =======================================================
  // IMAGE ERROR HANDLER
  // =======================================================

  const handleImageError = (
    event
  ) => {

    event.currentTarget.style.display =
      "none";


    const parent =
      event.currentTarget.parentElement;


    if (parent) {

      parent.classList.add(
        "slider-image-error"
      );

    }

  };


  // =======================================================
  // RENDER
  // =======================================================

  return (

    <div className="slider-management">


      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="slider-management-header">

        <div>

          <div className="slider-header-label">

            <ImageIcon size={17} />

            HOME PAGE SLIDER

          </div>


          <h1>
            Slider Management
          </h1>


          <p>
            Manage homepage slider images,
            titles, dates and descriptions.
          </p>

        </div>


        <div className="slider-header-actions">

          <button
            type="button"
            className="slider-refresh-btn"
            onClick={
              loadSliders
            }
            disabled={loading}
          >

            <RefreshCw
              size={17}
              className={
                loading
                  ? "slider-spin"
                  : ""
              }
            />

            Refresh

          </button>


          <button
            type="button"
            className="slider-add-btn"
            onClick={
              openAddForm
            }
          >

            <Plus size={18} />

            Add Slider

          </button>

        </div>

      </div>


      {/* ===================================================
          SUCCESS
      =================================================== */}

      {success && (

        <div className="slider-alert slider-success">

          <span>
            ✓
          </span>

          {success}


          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
          >

            <X size={16} />

          </button>

        </div>

      )}


      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (

        <div className="slider-alert slider-error">

          <span>
            !
          </span>

          {error}


          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >

            <X size={16} />

          </button>

        </div>

      )}


      {/* ===================================================
          ADD / EDIT FORM
      =================================================== */}

      {showForm && (

        <div className="slider-form-card">


          <div className="slider-form-header">

            <div>

              <span>
                {editingId
                  ? "EDIT SLIDER"
                  : "NEW SLIDER"}
              </span>


              <h2>

                {editingId
                  ? "Update Homepage Slider"
                  : "Create Homepage Slider"}

              </h2>

            </div>


            <button
              type="button"
              className="slider-close-btn"
              onClick={
                closeForm
              }
              disabled={saving}
            >

              <X size={20} />

            </button>

          </div>


          <form
            className="slider-form"
            onSubmit={
              handleSubmit
            }
          >


            {/* ===========================================
                IMAGE UPLOAD
            =========================================== */}

            <div className="slider-form-group slider-full">

              <label>

                Slider Image

                {!editingId && (
                  <span>*</span>
                )}

              </label>


              <div className="slider-upload-area">

                <input
                  id="slider-image-upload"
                  type="file"
                  name="image"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={
                    handleImageChange
                  }
                  hidden
                />


                <label
                  htmlFor="slider-image-upload"
                  className="slider-upload-button"
                >

                  <Upload size={22} />

                  <strong>
                    {form.image
                      ? "Change Image"
                      : "Browse Image"}
                  </strong>

                  <span>
                    Select image from your desktop
                  </span>

                  <small>
                    JPG, PNG, WEBP • Max 5 MB
                  </small>

                </label>

              </div>


              {/* =========================================
                  IMAGE PREVIEW
              ========================================= */}

              {imagePreview && (

                <div className="slider-preview-box">

                  <img
                    src={
                      imagePreview
                    }
                    alt="Slider preview"
                    onError={
                      handleImageError
                    }
                  />


                  {form.image && (

                    <div className="slider-selected-file">

                      <ImageIcon
                        size={15}
                      />

                      <span>

                        {form.image.name}

                      </span>

                      <button
                        type="button"
                        onClick={() => {

                          setForm(
                            (previous) => ({
                              ...previous,
                              image: null,
                            })
                          );

                          if (
                            editingId
                          ) {

                            setImagePreview(
                              form.imageUrl
                            );

                          } else {

                            setImagePreview(
                              ""
                            );

                          }

                        }}
                      >

                        <X size={15} />

                      </button>

                    </div>

                  )}

                </div>

              )}


              {editingId && !form.image && (

                <small className="slider-upload-note">

                  Leave image unchanged to keep
                  the existing image. Select a new
                  image only if you want to replace it.

                </small>

              )}

            </div>


            {/* ===========================================
                TITLE
            =========================================== */}

            <div className="slider-form-group">

              <label>

                Title

                <span>*</span>

              </label>


              <input
                type="text"
                name="title"
                value={
                  form.title
                }
                onChange={
                  handleChange
                }
                placeholder="Enter slider title"
                maxLength={255}
                required
              />

            </div>


            {/* ===========================================
                DATE
            =========================================== */}

            <div className="slider-form-group">

              <label>
                Date
              </label>


              <div className="slider-input-icon">

                <CalendarDays
                  size={18}
                />


                <input
                  type="date"
                  name="slideDate"
                  value={
                    form.slideDate
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

            </div>


            {/* ===========================================
                DESCRIPTION
            =========================================== */}

            <div className="slider-form-group slider-full">

              <label>
                Description
              </label>


              <textarea
                name="description"
                value={
                  form.description
                }
                onChange={
                  handleChange
                }
                placeholder="Enter slider description..."
                rows={5}
              />

            </div>


            {/* ===========================================
                DISPLAY ORDER
            =========================================== */}

            <div className="slider-form-group">

              <label>
                Display Order
              </label>


              <div className="slider-input-icon">

                <GripVertical
                  size={18}
                />


                <input
                  type="number"
                  name="displayOrder"
                  value={
                    form.displayOrder
                  }
                  onChange={
                    handleChange
                  }
                  min="0"
                />

              </div>

            </div>


            {/* ===========================================
                PUBLISHED
            =========================================== */}

            <div className="slider-form-group">

              <label>
                Visibility
              </label>


              <label className="slider-switch">

                <input
                  type="checkbox"
                  name="published"
                  checked={
                    form.published
                  }
                  onChange={
                    handleChange
                  }
                />


                <span className="slider-switch-track">

                  <span />

                </span>


                <strong>

                  {form.published
                    ? "Published"
                    : "Hidden"}

                </strong>

              </label>

            </div>


            {/* ===========================================
                ACTIONS
            =========================================== */}

            <div className="slider-form-actions">

              <button
                type="button"
                className="slider-cancel-btn"
                onClick={
                  closeForm
                }
                disabled={saving}
              >

                Cancel

              </button>


              <button
                type="submit"
                className="slider-save-btn"
                disabled={saving}
              >

                {saving ? (

                  <>
                    <span className="slider-button-spinner" />

                    Saving...
                  </>

                ) : (

                  <>
                    <Save size={17} />

                    {editingId
                      ? "Update Slider"
                      : "Create Slider"}
                  </>

                )}

              </button>

            </div>

          </form>

        </div>

      )}


      {/* ===================================================
          SLIDER LIST
      =================================================== */}

      <div className="slider-list-section">

        <div className="slider-list-header">

          <div>

            <span>
              MANAGE SLIDES
            </span>


            <h2>
              Homepage Sliders
            </h2>

          </div>


          <div className="slider-count">

            {sliders.length}

            <span>

              {sliders.length === 1
                ? " Slider"
                : " Sliders"}

            </span>

          </div>

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (

          <div className="slider-loading">

            <div className="slider-loading-spinner" />

            <p>
              Loading sliders...
            </p>

          </div>

        )}


        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          sliders.length === 0 && (

            <div className="slider-empty">

              <div className="slider-empty-icon">

                <ImageIcon
                  size={35}
                />

              </div>


              <h3>
                No sliders yet
              </h3>


              <p>

                Create your first homepage
                slider to display it on the
                website.

              </p>


              <button
                type="button"
                onClick={
                  openAddForm
                }
              >

                <Plus size={17} />

                Create First Slider

              </button>

            </div>

          )}


        {/* =================================================
            SLIDER CARDS
        ================================================= */}

        {!loading &&
          sliders.length > 0 && (

            <div className="slider-list">

              {sliders.map(
                (slider) => (

                  <article
                    className={`slider-admin-card ${
                      slider.published
                        ? ""
                        : "slider-disabled"
                    }`}
                    key={
                      slider.id
                    }
                  >


                    {/* IMAGE */}

                    <div className="slider-admin-image">

                      <img
                        src={
                          slider.imageUrl
                        }
                        alt={
                          slider.title ||
                          "Slider"
                        }
                        onError={
                          handleImageError
                        }
                      />


                      <div className="slider-order-badge">

                        #{slider.displayOrder}

                      </div>


                      <div
                        className={`slider-status-badge ${
                          slider.published
                            ? "published"
                            : "hidden"
                        }`}
                      >

                        <span />

                        {slider.published
                          ? "Published"
                          : "Hidden"}

                      </div>

                    </div>


                    {/* CONTENT */}

                    <div className="slider-admin-content">

                      <div className="slider-admin-date">

                        <CalendarDays
                          size={14}
                        />

                        {formatDate(
                          slider.slideDate
                        )}

                      </div>


                      <h3>

                        {slider.title ||
                          "Untitled Slider"}

                      </h3>


                      <p>

                        {slider.description ||
                          "No description available."}

                      </p>

                    </div>


                    {/* ACTIONS */}

                    <div className="slider-admin-actions">

                      <button
                        type="button"
                        className="slider-edit-btn"
                        onClick={() =>
                          openEditForm(
                            slider
                          )
                        }
                        title="Edit slider"
                      >

                        <Pencil
                          size={17}
                        />

                        Edit

                      </button>


                      <button
                        type="button"
                        className="slider-toggle-btn"
                        onClick={() =>
                          handleToggle(
                            slider.id
                          )
                        }
                        title={
                          slider.published
                            ? "Hide slider"
                            : "Publish slider"
                        }
                      >

                        {slider.published ? (

                          <>
                            <EyeOff
                              size={17}
                            />

                            Hide
                          </>

                        ) : (

                          <>
                            <Eye
                              size={17}
                            />

                            Publish
                          </>

                        )}

                      </button>


                      <button
                        type="button"
                        className="slider-delete-btn"
                        onClick={() =>
                          handleDelete(
                            slider.id
                          )
                        }
                        title="Delete slider"
                      >

                        <Trash2
                          size={17}
                        />

                        Delete

                      </button>

                    </div>

                  </article>

                )
              )}

            </div>

          )}

      </div>

    </div>

  );
}


export default SliderManagement;