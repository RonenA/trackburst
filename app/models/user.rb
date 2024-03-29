class User < ActiveRecord::Base
  validates_presence_of :token, :share_token

  before_validation :generate_token, :only => :create
  before_validation :generate_share_token, :only => :create

  has_many :votes

  def generate_token
    begin
      self.token = SecureRandom.urlsafe_base64(32)
    end until User.find_by_token(self.token).nil?
  end

  def generate_share_token
    begin
      self.share_token = SecureRandom.urlsafe_base64(4).gsub(/-|_/, '')
    end until share_token != '' && User.find_by_share_token(share_token).nil?
  end

  # Returns votes where user has voted according to the paramater
  # LikedStatus -> [Vote]
  def votes_as(liked)
    self.votes.where(:liked => liked).includes(:track)
  end

  # List of all your upvotes, in order of recency
  # [Vote]
  def like_votes
    votes_as(true).order('updated_at DESC')
  end

  def liked_tracks
    like_votes.map(&:track)
  end

  # Have you liked any tracks ever?
  # Bool
  def has_liked_tracks?
    like_votes.exists?
  end

  # List of tracks you haven't voted on yet
  # [Track]
  def tracks_to_vote
    tracks = votes_as(nil).map(&:track)

    transaction do
      while tracks.length < 50
        track = Track.sample
        vote = self.votes.new { |v| v.track = track }

        if vote.save
          tracks << track
        end
      end
    end

    tracks
  end

end
