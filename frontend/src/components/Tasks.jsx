import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch';
import Loader from './utils/Loader';
import Tooltip from './utils/Tooltip';

const Tasks = () => {

  const authState = useSelector(state => state.authReducer);
  const [tasks, setTasks] = useState([]);
  const [completionMessage, setCompletionMessage] = useState('');
  const [fetchData, { loading }] = useFetch();
  const [searchQuery, setSearchQuery] = useState('');
  const fetchTasks = useCallback(() => {
    const config = { url: "/tasks", method: "get", headers: { Authorization: authState.token } };
    fetchData(config, { showSuccessToast: false }).then(data => setTasks(data.tasks));
  }, [authState.token, fetchData]);

  useEffect(() => {
    if (!authState.isLoggedIn) return;
    fetchTasks();
  }, [authState.isLoggedIn, fetchTasks]);

  const filteredTasks = searchQuery
  ? tasks.filter(task => 
      (task.title && task.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  : tasks;
  const handleDelete = (id) => {
    const config = { url: `/tasks/${id}`, method: "delete", headers: { Authorization: authState.token } };
    fetchData(config).then(() => fetchTasks());
  }
  const handleToggleCompleted = (id) => {
    const updatedTasks = tasks.map(task => {
      if (task._id === id) {
        // Toggle the completed status
        return { ...task, completed: !task.completed };
      }
      return task;
    });
  
    // Update the tasks state
    setTasks(updatedTasks);
  
    // Send the updated task to the server
    const config = { 
      url: `/tasks/${id}`, 
      method: "put", 
      headers: { Authorization: authState.token }, 
      data: { 
        completed: !tasks.find(task => task._id === id).completed, 
        description: tasks.find(task => task._id === id).description 
      } 
    };
  
    fetchData(config).then(response => {
      setCompletionMessage(response.msg); // Show the response message
      setTimeout(() => setCompletionMessage(''), 3000); // Clear message after 3 seconds
    });
  };


  return (
    <>
      <div className="my-2 mx-auto max-w-[700px] py-4">
      <input 
          type="text" 
          placeholder="Search tasks by title..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="border rounded-md p-2 mb-4 w-full"
        />

{filteredTasks.length !== 0 && <h2 className='my-2 ml-2 md:ml-0 text-xl'>Your tasks ({filteredTasks.length})</h2>}
        {loading ? (
          <Loader />
        ) : (
          <div>
            {filteredTasks.length === 0 ? (

              <div className='w-[600px] h-[300px] flex items-center justify-center gap-4'>
                <span>No tasks found</span>
                <Link to="/tasks/add" className="bg-blue-500 text-white hover:bg-blue-600 font-medium rounded-md px-4 py-2">+ Add new task </Link>
              </div>

            ) : (
              filteredTasks.map((task, index) => {
                // Find the original index of the task in the tasks array
                const originalIndex = tasks.findIndex(t => t._id === task._id);
                return (
                  <div key={task._id} className='bg-white my-4 p-4 text-gray-600 rounded-md shadow-md'>
                    <div className='flex items-center'>
                      <input 
                        type="checkbox" 
                        checked={task.completed} 
                        onChange={() => handleToggleCompleted(task._id)} 
                        className="mr-2" 
                      />
                      <span className={`font-medium ${task.completed ? 'line-through' : ''}`}>Task #{originalIndex + 1}</span>

                      <Tooltip text={"Edit this task"} position={"top"}>
                        <Link to={`/tasks/${task._id}`} className='ml-auto mr-2 text-green-600 cursor-pointer'>
                          <i className="fa-solid fa-pen"></i>
                        </Link>
                      </Tooltip>

                      <Tooltip text={"Delete this task"} position={"top"}>
                        <span className='text-red-500 cursor-pointer' onClick={() => handleDelete(task._id)}>
                          <i className="fa-solid fa-trash"></i>
                        </span>
                      </Tooltip>
                    </div>
                    <div className='whitespace-pre'>{task.description}</div>
                  </div>
                );
              })

            )}
          </div>
        )}
      </div>
    </>
  )

}

export default Tasks