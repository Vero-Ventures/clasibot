'use client';
// Inspired by react-hot-toast library
import { useEffect, useState } from 'react';
import type { ToastActionElement, ToastProps } from '@/components/ui/toast';
import type { ReactNode } from 'react';

// Define the limit and delay constants.
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

// Define the toaster toast type.
type ToasterToast = ToastProps & {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ToastActionElement;
};

// Define the toaster action types within a typed object.
type ActionType = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
};

// Set an initial count value to 0.
let count = 0;

function genId() {
  // Increment the count and return the count as a string.
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

// Define the action types using toast.
type Action =
  | {
      // Add action.
      type: ActionType['ADD_TOAST'];
      toast: ToasterToast;
    }
  | {
      // Update action.
      type: ActionType['UPDATE_TOAST'];
      toast: Partial<ToasterToast>;
    }
  | {
      // Dismiss action.
      type: ActionType['DISMISS_TOAST'];
      toastId?: ToasterToast['id'];
    }
  | {
      // Remove action.
      type: ActionType['REMOVE_TOAST'];
      toastId?: ToasterToast['id'];
    };

// Define the toaster state with an array of toaster toasts.
interface State {
  toasts: ToasterToast[];
}

// Define a timeout constant that maps toast IDs to timeout values.
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// Add a toast to the remove queue using the toast ID.
const addToRemoveQueue = (toastId: string) => {
  // If the toast timeouts do not have the toast ID, return.
  if (toastTimeouts.has(toastId)) {
    return;
  }

  // Set a timeout to remove the toast after a delay.
  const timeout = setTimeout(() => {
    // Delete the toast ID from the toast timeouts and use the remove toast action.
    toastTimeouts.delete(toastId);
    dispatch({
      toastId,
      type: 'REMOVE_TOAST',
    });
  }, TOAST_REMOVE_DELAY);

  // Set a new toast timeout using the toast ID and the new timeout.
  toastTimeouts.set(toastId, timeout);
};

// Define the toaster reducer function using a state and action.
export const reducer = (state: State, action: Action): State => {
  // Define a switch statement using the action type.
  switch (action.type) {
    // Add a toast, then return the state with the new toast.
    case 'ADD_TOAST':
      return {
        ...state,
        // Add the new toast to the front of the toasts array and limit the array to the toast limit.
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    // Update a toast, then return the state with the updated toast.
    case 'UPDATE_TOAST':
      return {
        ...state,
        // Map over the toasts and update the toast if the toast ID matches the action toast ID.
        toasts: state.toasts.map((t) => {
          if (t.id === action.toast.id) {
            return { ...t, ...action.toast };
          } else {
            return t;
          }
        }),
      };

    // Dismiss a toast, then return the state with the dismissed toast.
    case 'DISMISS_TOAST': {
      // Define the toast ID using the action.
      const { toastId } = action;
      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        // If the toast ID is defined, add the toast to the remove queue.
        addToRemoveQueue(toastId);
      } else {
        // If the toast ID is undefined, add all toasts to the remove queue.
        state.toasts.forEach((removeToast) => {
          addToRemoveQueue(removeToast.id);
        });
      }

      // Return the state with the toasts filtered by the toast ID.
      return {
        ...state,
        toasts: state.toasts.map((t) => {
          if (t.id === toastId) {
            return {
              ...t,
              open: false,
            };
          } else {
            return t;
          }
        }),
      };
    }

    // Remove a toast, then return the state with the removed toast.
    case 'REMOVE_TOAST':
      // If the toast ID is undefined, return the state with an empty array of toasts.
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      // Otherwise, return the state with the toasts filtered by the toast ID.
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// Define the listeners array as initially empty.
const listeners: Array<(state: State) => void> = [];

// Define the memory state as a dictionary with an empty array of toasts.
let memoryState: State = { toasts: [] };

// Define the dispatch function using an action.
function dispatch(action: Action) {
  // Update the memory state using the reducer and action.
  memoryState = reducer(memoryState, action);
  // Call each listener with the memory state.
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// Define the toast function using the toaster toast.
type Toast = Omit<ToasterToast, 'id'>;

// Define the toast function using the toast props.
function toast({ ...props }: Toast) {
  // Define the toast ID using the genId function.
  const id = genId();

  // Define the update function using the toast props.
  const update = (updateProps: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...updateProps, id },
    });
  // Define the dismiss function using the toast ID.
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  // Dispatch the add toast action with the toast props.
  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      // Define the onOpenChange function using the open value.
      onOpenChange: (open) => {
        // If the open value is now false, dismiss the toast.
        if (!open) {
          dismiss();
        }
      },
    },
  });

  // Return the toast ID, dismiss function, and update function.
  return {
    id,
    dismiss,
    update,
  };
}

// Define the useToast function.
function useToast() {
  // Define a state using the memory state.
  const [state, setState] = useState<State>(memoryState);

  // Define the toast function using the toast props.
  useEffect(() => {
    // Push the state to the listeners array.
    listeners.push(setState);

    // Return a function that removes the state from the listeners array.
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  // Return the state with the toasts and the dismiss function.
  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}

// Export the toast and useToast functions.
export { useToast, toast };
