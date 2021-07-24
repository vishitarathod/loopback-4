import {
  model,
  property,
  repository,
 
} from '@loopback/repository';
import {
  post,
  getModelSchemaRef,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import { promisify } from 'util';
import {User} from '../models';
import {UserRepository} from '../repositories';
import * as nodemailer from 'nodemailer';
const jwt=require('jsonwebtoken')

const signAsync = promisify(jwt.sign);
const verifyAsync = promisify(jwt.verify);

@model()
export class NewUser extends User{
  @property({
    type: 'string',
    required: true,
  })
  newpass: string;
} 

export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository : UserRepository,
  ) {}

  @post('/signup')
  @response(200, {
    description: 'User model instance',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async signUp(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {
            // title: 'NewUser',
            exclude: ['id','token'],
          }),
        },
      },
    })
    user: Omit<User, 'id'>,
  ): Promise<User> {
    const userInfoForToken = {
      id: 'id'
  };
    try {
        const token = await signAsync(userInfoForToken, "dshxfsvwuyhszasadfvolsawfvdc", {
            expiresIn: '5h',
        });
        await this.userRepository.create(user);
        return token;
    }
    catch (error) {
        throw new HttpErrors.Unauthorized(`Error encoding token : ${error}`);
    }
  }

    @post('/login')
    @response(200, {
      description: 'User model instance',
      content: {'application/json': {schema: getModelSchemaRef(User)}},
    })
    async login( 
    @requestBody({
        content: {
          'application/json': {
          schema: getModelSchemaRef(User, {
            // title: 'NewUser',
            exclude: ['id','token'],
          }),
        },
      },
    })
    user: Omit<User, 'id'>,
  ): Promise<string>  {
      try {
          var userExist;
          userExist = await this.userRepository.find({ where: { email: user.email, password: user.password }, });
          // console.log(userExist);
          if (userExist.length == 0) {
              throw Error("user is not registered..");
          }
          return "login sucessfull";
      }
      catch (error) {
          throw new HttpErrors.Unauthorized("user is not registered..");
      }
}


  @post('/forgot-password')
  @response(200, {
    description: 'User model instance',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
    })
    async forgotPassword(
      @requestBody({
          content: {
            'application/json': {
            schema: getModelSchemaRef(User, {
              // title: 'NewUser',
              exclude: ['id','token'],
            }),
          },
        },
      })
      user: Omit<User, 'id'>,
    ): Promise<string> {
      try {
          var userExist;
          userExist = await this.userRepository.find({ where: { email: user.email, password: user.password }, });
          console.log(userExist);
          if (userExist.length == 0) {
              throw Error("user is not registered..");
          }
          const token = await signAsync({ id: 'id' }, "dshxfsvwuyhszasadfvolsawfvdc", {
              expiresIn: '5h',
          });
          console.log(token);
          let transporter = nodemailer.createTransport({
              service: "gmail",
              "auth": {
                  "user": "",
                  "pass": ""
              }
          });
          await transporter.sendMail({
              from: "",
              to: `${user.email}`,
              subject: "forgot password",
              html: `${token}`
          });
          await this.userRepository.updateAll({ token: token }, { email: user.email });
          return "email send sucessfull";
      }
      catch (error) {
          throw new HttpErrors.Unauthorized("user not registered..");
      }
  }

    @post('/reset-password')
    @response(200, {
      description: 'User model instance',
      content: {'application/json': {schema: getModelSchemaRef(User)}},
      })
      async resetPassword( 
      @requestBody({
        content: {
          'application/json': {
          schema: getModelSchemaRef(NewUser, {
            // title: 'NewUser',
            exclude: ['id','email','password'],
          }),
        },
      },
    })
    user: Omit<NewUser, 'id'>,
  ): Promise<string> {
        try {
            var userExist;
            userExist = await this.userRepository.find({ where: { token: user.token }, });
            // console.log(userExist);
            if (userExist.length == 0) {
                throw Error("unauthorize error");
            }
            await this.userRepository.updateAll({ password: user.newpass, token: '' }, { token: user.token });
            return "password reset successfull";
        }
        catch (error) {
            throw new HttpErrors.Unauthorized("user not registered..");
        }
    }

}
