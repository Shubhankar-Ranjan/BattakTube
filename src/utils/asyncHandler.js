const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch((err) => next(err))
    }
}


export { asyncHandler }



// Another method to write the asyncHandler

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }


// Steps to understand the above code:
// const asyncHandler = () => {}
// const asyncHandler = (func) => {() => {}}
// const asyncHandler = (func) => () => {} // removing the {} from the arrow function
// const asyncHandler = (func) => async () => {} // adding async
