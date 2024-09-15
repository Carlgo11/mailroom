FROM rspamd/rspamd

ENV RSPAMD_PASSWORD='password'

USER 0:0

COPY --chown=11333:11333 docker-entrypoint.sh /docker-entrypoint.sh

COPY --chown=11333:11333 ./conf/ /etc/rspamd/local.d

RUN chown 11333:11333 /etc/rspamd -R

USER 11333:11333

ENTRYPOINT ["/docker-entrypoint.sh"]

STOPSIGNAL SIGTERM

CMD [ "/usr/bin/rspamd", "-f" ]

EXPOSE 11333 11334
