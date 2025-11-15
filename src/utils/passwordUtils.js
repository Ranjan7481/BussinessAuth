const bcrypt = require('bcryptjs');

 const hashPassword = async (plainPassword) =>{

  const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    return hashedPassword;  
}

  const comparePassword = async (plainPassword, hashedPassword) => {

    if(!hashPassword) return false;
    return await bcrypt.compare(plainPassword, hashedPassword);
}


module.exports = { hashPassword, comparePassword };