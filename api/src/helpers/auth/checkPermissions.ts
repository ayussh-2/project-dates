/* eslint-disable consistent-return */
import {
  Request,
  Response,
} from 'express';
import { AuthenticationError } from 'helpers';
import { Permission } from 'rest/model';

import { PERMISSIONS } from '@constants';

import { verifyUser } from './verify';

export type CustomNextFunction = (
  req: Request,
  res: Response,
) => Promise<Response<unknown, Record<string, unknown>>>;

export const checkRestPermissions =
  (
    next: CustomNextFunction,
    requiredPermissions?: [PERMISSIONS?],
    id?: string,
  ) =>
  async (req: Request, res: Response) => {
    if (!req.headers || !req.headers.authorization) {
      return res.status(400).send('Bad Request: Token not found');
    }

    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(403).send('Permission Denied');
    }

    try {
      const decodedToken = await verifyUser(token);
      if (!decodedToken) {
        return res.status(403).send('Permission Denied');
      }

      if (!requiredPermissions || requiredPermissions.length === 0) {
        return next(req, res);
      }

      const permissions = await Permission.findOne({
        uid: decodedToken.uid,
      });

      if (!permissions) {
        return res.status(403).send('Permission Denied');
      }

      for (let i = 0; i < requiredPermissions.length; i += 1) {
        const permission = requiredPermissions[i];
        if (
          (permission === PERMISSIONS.SUPER_ADMIN && permissions.superAdmin) ||
          (permission === PERMISSIONS.SUPER_EDITOR &&
            permissions.superEditor) ||
          (permission === PERMISSIONS.SUPER_VIEWER && permissions.superViewer)
        ) {
          return next(req, res);
        }

        if (
          (permission === PERMISSIONS.ORG_ADMIN &&
            permissions.orgAdmin.length > 0 &&
            id &&
            permissions.orgAdmin.includes(id)) ||
          (permission === PERMISSIONS.ORG_EDITOR &&
            permissions.orgEditor.length > 0 &&
            id &&
            permissions.orgEditor.includes(id)) ||
          (permission === PERMISSIONS.SUPER_VIEWER &&
            permissions.orgViewer.length > 0 &&
            id &&
            permissions.orgViewer.includes(id))
        ) {
          return next(req, res);
        }
      }

      return res.status(403).send('Permission Denied');
    } catch (error) {
      return res.status(403).send('Permission Denied');
    }
  };

export const checkGraphQLPermissions =
  (next: any, requiredPermissions?: [PERMISSIONS?], id?: string) =>
  async (parent: any, args: any, context: any, info: any) => {
    if (!context.req.headers || !context.req.headers.authorization) {
      throw AuthenticationError;
    }

    const token = context.req.headers.authorization.split(' ')[1];
    if (!token) {
      throw AuthenticationError;
    }

    try {
      const decodedToken = await verifyUser(token);
      if (!decodedToken) {
        throw AuthenticationError;
      }

      if (!requiredPermissions || requiredPermissions.length === 0) {
        return next(parent, args, context, info);
      }

      const permissions = await Permission.findOne({
        uid: decodedToken.uid,
      });

      if (!permissions) {
        throw AuthenticationError;
      }

      for (let i = 0; i < requiredPermissions.length; i += 1) {
        const permission = requiredPermissions[i];
        if (
          (permission === PERMISSIONS.SUPER_ADMIN && permissions.superAdmin) ||
          (permission === PERMISSIONS.SUPER_EDITOR &&
            permissions.superEditor) ||
          (permission === PERMISSIONS.SUPER_VIEWER && permissions.superViewer)
        ) {
          return next(parent, args, context, info);
        }

        if (
          (permission === PERMISSIONS.ORG_ADMIN &&
            permissions.orgAdmin.length > 0 &&
            id &&
            permissions.orgAdmin.includes(id)) ||
          (permission === PERMISSIONS.ORG_EDITOR &&
            permissions.orgEditor.length > 0 &&
            id &&
            permissions.orgEditor.includes(id)) ||
          (permission === PERMISSIONS.SUPER_VIEWER &&
            permissions.orgViewer.length > 0 &&
            id &&
            permissions.orgViewer.includes(id))
        ) {
          return next(parent, args, context, info);
        }
      }

      throw AuthenticationError;
    } catch (error) {
      throw AuthenticationError;
    }
  };
