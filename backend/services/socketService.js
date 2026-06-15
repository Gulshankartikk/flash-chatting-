const{Server, Socket} = require('socket.io');
const user =require("../models/user");
const message =require("../models/message");
const User = require('../models/user');


// map to store online user->user id,socketId
const onlineUsers = new Map(); // ✅ FIXED: was missing, caused the crash
const typingUsers = new Map();

const initilizeSocket =(server) =>{
    const io =new Server(server,{
        cors:{
            origin:process.env.FRONTEND_URL,
            credentials:true,
            methods:['GET','POST','PUT','DELETE','OPTIONS'],
        },
        pingTimeout:6000,

    });


    //when a new socket and mark them online in db

    io.on("connection",(socket) => {
        console.log(`User connected: ${socket.id}`)
        let userId = null;

        // handle user connection and mark them online in db

        socket.on("user_connected",async(connectingUserId)=>{
            try {
                userId =connectingUserId
                onlineUsers.set(userId,socket.id); // ✅ FIXED: was onlineUser
                socket.join(userId)

                // update user status in db
                await user.findByIdAndUpdate(userId,{
                    isOnline:true,
                    lastSeen:new Date(),
                });

                //notify all user that this user is now online
                io.emit("user_status",{userId,isOnline:true})

            } catch (error) {
                console.log('Error handling user connection',error)
            }
        })

        //return online status of requested user
        socket.on("get_user_status",(requestedUserId,callback)=>{
            const isonline =onlineUsers.has(requestedUserId)
            callback({
                userId:requestedUserId,
                isonline,
                lastSeen:isonline ? new Date() : null,
            })
        })

        //forword message to receiver if online

        socket.on("send_message",async(message)=>{
            try {
                const receiverSocketId =onlineUsers.get(message.receiver?._id); // ✅ FIXED: was onlineUser
                if(receiverSocketId){
                    io.to(receiverSocketId).emit("receive_message",message)
                }
            } catch (error) {
                console.error("Error sending message",error)
                socket.emit("message_error",{error:"Failed to send message"})
                
            }
        })
       
       //update message as read and notify sender 
       socket.on("message_read",async({messageIds,senderId}) =>{
        try {
            await MessageChannel.updateMany(
                {_id:{$in:messageIds}},
                {$set:{messageStatus:"read"}}
            )
            const senderSocketId =onlineUsers.get(senderId);
            if(senderSocketId){
                messageIds.forEach((messageId) =>{
                    io.to(senderSocketId).emit("message_status_update",{
                        messageId,
                        messageStatus:"read"
                    })
                })
            }
        } catch (error) {
            console.error('error updating message read status',error)
        }
       })
       //handle typing start eventv and auto _stop after 3s
       socket.on("typing-start",({conversation,receiverId})=>{
         if(!userId || !conversationId || !receiverId)return;

         if(!typingUsers.has(userId)) typingUsers.set(userId,{});

         const userTyping =typingUsers.get(userId)

         userTyping[conversationId] =true;

         //clear any exiting timeout
         if(userTyping[`${conversationId}_timeout`]){
            clearTimeout(userTyping[`${conversationId}_timeout`])
         }
         //auto_stop after 3s
         userTyping[`${conversationId}_timeout`] = setTimeout(()=>{
            userTyping[conversationId] =false;
            socket.to(receiverId).emit("user_typing",{
                userId,
                conversationId,
                isTyping:false
            })
         },3000)

         //notify receiver
         socket.io(receiverId).emit("user_Typing",{
            userId,
            conversationId,
            isTyping:true
        
         })
       }) 
       socket.on("typing_stop",({conversationId,receiverId}) =>{
        if(!userId || !conversationId || !receiverId)return;

         if(typingUsers.has(userId)) {
            const userTyping =typingUsers.get(userId);
            userTyping[conversationId]=false

            if(userTyping[`${conversationId}_timeout`]){
                clearTimeout(userTyping[`${conversationId}_timeout`])
                delete userTyping[`${conversationId}_timeout`]
            }
         };

         socket.to(receiverId).emit("user_typing",{
            userId,
            conversationId,
            isTyping:false
         })

         
       })
       //add or update reaction on message
       socket.on("add_reaction",async({messageId,emoji,userId,reactionUserId}) =>{
        try {
            const message =await Message.findById(messageId);
            if(!message)return;

            const exitingIndex =message.reaction.findIndex(
                (r)=> r.user.toString()===reactionUserId
            )
            if(exitingIndex > -1){
                const exiting=message.reaction(exitingIndex)
                if(exiting.emoji===emoji){

                    //remove same reaction
                    message.reaction.splice(exitingIndex,1)
                } else {
                    //change emoji
                    message.reaction[exitingIndex].emoji = emoji;
                }
            } else {
                    
                    message.reaction.push({ user:reactionUserId,emoji});
                }
                await message.save();
                const populatedMessage = await Message.findOne(message?._id)
                  .populated("sender","username profilePicture")
                  .populated("receiver","username profilePicture")
                  .populated("reactions.user","username ")

                  const reactionUpdated ={
                    messageId,
                    reaction:populatedMessage.reaction
                  }

                  const senderSocket =onlineUsers.get(populatedMessage.sender_id.toString()); // ✅ FIXED: was onlineUser
                  const receiverSocket =onlineUsers.get(populatedMessage.sender_id.toString()); // ✅ FIXED: was onlineUser

                  if(senderSocket) io.to(senderSocket).emit("reaction_update",reactionUpdated)
                  if(receiverSocket) io.to(senderSocket).emit("reaction_update",reactionUpdated)
                } catch (error) {
                   console.log("error handling reaction",error)
        }
       });
        // handle disconnection and mark user offline
        const handleDisconnected =async() =>{
             if(!userId)return;

             try {
                onlineUsers.delete(userId); // ✅ FIXED: was onlineUser
                //clear all typing timesouts
                if(typingUsers.has(userId)){
                    const user_Typing =typingUsers.get(userId);
                    Object.keys(userTyping).foreach((key)=>{
                        if(key.endWith('_timeout'))clearTimeout(userTyping[key])
                    })
                typingUsers.delete(userId)
                }
                await User.findByIdAndUpdate(userId,{
                    isOnline:false,
                    lastseen:new Date(),
                })
                io.emit("user_status",{
                    userId,isonline:false,
                    lastSeen:new Date(),
                })

                socket.leave(userId),
                console.log(`user${userId} disconnected`)
             } catch (error) {
                console.error("error handling disconnection",error)
             }
        }
        //disconnect event
        socket.on("disconnect",handleDisconnected)

    });
    // attach the online user map to the socket server for external user
    io.socketUserMap = onlineUsers; // ✅ FIXED: onlineUsers now declared at top

    return io;
   
};
module.exports =initilizeSocket;