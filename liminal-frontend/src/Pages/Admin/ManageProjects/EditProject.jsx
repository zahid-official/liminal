/* eslint-disable react/prop-types */
import { useState } from "react";
import { FaPen } from "react-icons/fa";
import ProjectModal from "./ProjectModal";
import useAxiosSecure from "../../../Auth/Hook/useAxiosSecure";

const EditProject = ({ projectId, refetchProjects }) => {
  const axiosSecure = useAxiosSecure();

  // state for projectData
  const [projectData, setProjectData] = useState({});
  // handleEdit
  const handleEdit = async (id) => {
    const res = await axiosSecure.get(`/projectDetails/${id}`);
    setProjectData(res.data);
    document.getElementById(`modal_${id}`).showModal();
  };

  return (
    <>
      <div>
        <button
          onClick={() => handleEdit(projectId)}
          className="btn text-[#054b32] btn-sm text-xl h-10"
        >
          <FaPen></FaPen>
        </button>
      </div>

      {/* modal */}
      <dialog id={`modal_${projectId}`} className="modal">
        <div className="modal-box max-w-3xl py-16 px-8">
          {/* close modal */}
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-red-600 text-lg">
              ✕
            </button>
          </form>

          {/* modal content */}
          <ProjectModal
            projectData={projectData}
            refetchProjects={refetchProjects}
          ></ProjectModal>
        </div>
      </dialog>
    </>
  );
};

export default EditProject;
