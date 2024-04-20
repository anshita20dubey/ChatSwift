const io = require("socket.io")();
const socketapi = {
    io: io
};
const user = require('./Model/user');
const groupModel = require('./Model/group')
const messageModel = require('./Model/message')

// Add your socket.io logic here!
io.on("connection", function (socket) {
    socket.on('join-server', async userDetails => {

        const currentUser = await user.findOne({
            username: userDetails.username
        })

        const allGroupsOfUser = await groupModel.find({
            //un groups ko find kro jinke users array ke andar ye id aa ri ho
            users:
            {
                $in: [   //ye id include h agr to wo group
                    currentUser._id
                ]
            }
        })
        allGroupsOfUser.forEach(group => {
            socket.emit('group-joined', group)
        })

        // console.log(allGroupsOfUser)

        // console.log(currentUser)

        await user.findOneAndUpdate({
            username: userDetails.username
        }, {
            socketId: socket.id,
        })

        const onlineUsers = await user.find({
            socketId: {
                $nin: ["", socket.id]
            }
        })
        onlineUsers.forEach(onlineUser => {
            socket.emit('new-user-join', {
                profileImage: onlineUser.profileImage,
                username: onlineUser.username,
            })
        })
        socket.broadcast.emit('new-user-join', userDetails);
    })

    socket.on('disconnect', async () => {
        console.log('user disconnected');

        await user.findOneAndUpdate({
            socketId: socket.id
        }, {
            socketId: "",
        })
    })

    socket.on('private-message', async messageObject => {

        //message,sender,receiver

        const newMessage = await messageModel.create({
            msg: messageObject.message,
            sender: messageObject.sender,           //save
            receiver: messageObject.receiver,
            time: new Date()
        })
        const receiver = await user.findOne({
            username: messageObject.receiver,
            message: messageObject.message,
            timestamp: newMessage.time   //user dudhega agr null milega kyuki wo group m message kr rha h
        });
        //agr receviver null h
        if (!receiver) { //to ye query chlegi

            const group = await groupModel.findOne({
                name: messageObject.receiver //for example group insta naam aaya group ka to uske user populate kr dege
            }).populate('users')  //to get the sokcetid of each user

            if (!group) //agr group nhi mila
                return;  //fir hme nhi pta kya h

            //27

            group.users.forEach(user => {
                socket.to(user.socketId).emit('receive-private-message', {
                    message: messageObject.message,
                    timestamp: newMessage.time
                })  //messageObject have message,sender,receiver
            })

        }

        //27-01-2024


        //

        if (receiver) {
            const timestamp = newMessage.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            socket.to(receiver.socketId).emit('receive-private-message', {
                message: messageObject.message,
                timestamp: newMessage.time
            });
        }
    })

    socket.on('disconnect', async () => {
        await user.findOneAndUpdate({
            socketId: socket.id
        }, {
            socketId: ""
        })
        console.log('User disconnected');
        // Rest of your code...
    });

    socket.on('fetch-conversation', async conversationDetails => {

        const isUser = await user.findOne({
            username: conversationDetails.receiver
        })

        //agr receiver person h to ye if chlega(one to one chat) , group h to else chlega

        if (isUser) {

            const allMessages = await messageModel.find({
                $or: [
                    {
                        sender: conversationDetails.sender,
                        receiver: conversationDetails.receiver
                    },
                    {
                        sender: conversationDetails.receiver,
                        receiver: conversationDetails.sender
                    }
                ],
            }).sort({ createdAt: 1 });
            console.log(allMessages);
            socket.emit('send-conversation', allMessages)

        }

        else {
            const allMessages = await messageModel.find({
                receiver: conversationDetails.receiver
            })
            socket.emit('send-conversation', allMessages)

        }

    })

    //27



    socket.on("create-new-group", async groupDetails => {

        //new group create
        const newGroup = await groupModel.create({
            name: groupDetails.groupName,

        })

        //jis user ne bnaya h group uski id dudhna h
        const currentUser = await user.findOne({
            username: groupDetails.sender
        })

        //usko users jo array h usme push kr do
        newGroup.users.push(currentUser._id)

        await newGroup.save()

        //jo new grroup bnaya h usko ui pe send kr  rhe  h
        socket.emit('group-created', newGroup)

    })
    socket.on('join-group', async joingroupDetails => {


        console.log(joingroupDetails)


        //konse grp m join hoga wo find krege
        const group = await groupModel.findOne({
            name: joingroupDetails.groupName,
        })
        //wo user find krege
        const currentUser = await user.findOne({
            username: joingroupDetails.sender
        })
        //users array m push kr dege
        group.users.push(currentUser._id)
        await group.save()
        socket.emit('group-joined', joingroupDetails = {
            profileImage: group.profileImage,
            name: group.name
        }

        )


    })

    console.log("A user connected");
});
// end of socket.io logic

module.exports = socketapi;