// DELETE keys
// [].forEach(async (toDelete: string) => {
//   if (!toDelete.startsWith('RUM6')) {
//     toDelete = `RUM6${toDelete}`;
//   }

//   const x = await fetch(
//     `https://${dbAclWriterHost}:${dbAclWriterPort}/acl/publickey/${encodeURIComponent(dheCredentials.username)}?${encodeURIComponent('encodedStr')}=${encodeURIComponent(toDelete)}&${encodeURIComponent('algorithm')}=${encodeURIComponent('ECDSA')}`,
//     {
//       method: 'DELETE',
//       headers: {
//         /* eslint-disable @typescript-eslint/naming-convention */
//         Authorization: await dheClient.createAuthToken('DbAclWriteServer'),
//         /* eslint-enable @typescript-eslint/naming-convention */
//       },
//     }
//   );

//   console.log(x.status);
// });
